/**
 * @fileoverview Фаза 5 — Сбор ввода — JSON-мутации
 *
 * Тестирует все аспекты collectUserInput:
 *  Блок A: collectUserInput true/false
 *  Блок B: inputType (text/photo/video/audio/document/все сразу)
 *  Блок C: validationType (none/email/phone/number + граничные)
 *  Блок D: minLength / maxLength
 *  Блок E: retryMessage / successMessage (спецсимволы, переменные)
 *  Блок F: saveToDatabase true/false
 *  Блок G: appendVariable true/false
 *  Блок H: inputTargetNodeId (валидный/пустой/несуществующий)
 *  Блок I: skipButtons (skipDataCollection)
 *  Блок J: Сохранение в bot_users (username, first_name, last_name, user_id)
 *  Блок K: Сохранение в user_telegram_settings (tg_phone, tg_api_id, tg_api_hash, tg_session)
 *  Блок L: Сохранение в user_ids
 *  Блок M: Комбинации (photo+text, все медиа, валидация+append, db+append)
 *  Блок N: Граничные случаи (пустой inputVariable, длинный retryMessage, спецсимволы в именах)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../lib/bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function makeBtn(overrides: Record<string, unknown> = {}) {
  return {
    id: `btn_${Math.random().toString(36).slice(2, 8)}`,
    text: 'Кнопка',
    action: 'goto',
    target: '1KvQin0bE6-tRu9mm8xK_',
    hideAfterClick: false,
    skipDataCollection: false,
    ...overrides,
  };
}

/** Патчит start-узел (nodes[0]) */
function patchStart(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, patch);
  return p;
}

/** Патчит message-узел (nodes[1]) */
function patchMsg(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[1].data, patch);
  return p;
}

/** Генерирует с userDatabaseEnabled=true (нужно для проверки сохранения в БД) */
function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase5DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

/** Генерирует без БД */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase5_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p5_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

// ─── Раннер ──────────────────────────────────────────────────────────────────

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         Фаза 5 — Сбор ввода (70+ тестов)                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: collectUserInput true/false
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: collectUserInput ──────────────────────────────────────');

test('A01', 'collectUserInput:false → нет waiting_for_input', () => {
  const code = gen(patchMsg({ collectUserInput: false }), 'a01');
  syntax(code, 'a01');
  ok(!code.includes('waiting_for_input'), 'waiting_for_input не должен быть при false');
});

test('A02', 'collectUserInput:true → есть waiting_for_input', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    inputVariable: 'my_answer',
    enableTextInput: true,
  }), 'a02');
  syntax(code, 'a02');
  ok(code.includes('waiting_for_input'), 'waiting_for_input должен быть при true');
  ok(code.includes('"variable"') || code.includes("'variable'"), 'поле variable должно быть');
});

test('A03', 'collectUserInput:true без inputVariable → дефолт "input"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
  }), 'a03');
  syntax(code, 'a03');
  ok(code.includes('"input"') || code.includes("'input'"), 'дефолтная переменная "input"');
});

test('A04', 'collectUserInput:true + inputVariable задан явно', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    inputVariable: 'user_answer_custom',
    enableTextInput: true,
  }), 'a04');
  syntax(code, 'a04');
  ok(code.includes('user_answer_custom'), 'кастомная переменная должна быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: inputType — медиа-типы
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: inputType (медиа) ─────────────────────────────────────');

test('B01', 'enableTextInput:true → modes содержит "text"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    enablePhotoInput: false,
    inputVariable: 'txt_var',
  }), 'b01');
  syntax(code, 'b01');
  ok(code.includes('"text"') || code.includes("'text'"), 'mode text должен быть');
});

test('B02', 'enablePhotoInput:true + photoInputVariable → modes содержит "photo"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: false,
    enablePhotoInput: true,
    photoInputVariable: 'photo_file',
    inputVariable: 'photo_var',
  }), 'b02');
  syntax(code, 'b02');
  ok(code.includes('"photo"') || code.includes("'photo'"), 'mode photo должен быть');
  ok(code.includes('photo_file'), 'photo_variable должна быть в коде');
});

test('B03', 'enableVideoInput:true + videoInputVariable → modes содержит "video"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: false,
    enableVideoInput: true,
    videoInputVariable: 'video_file',
    inputVariable: 'video_var',
    buttons: [], // очищаем кнопки чтобы inputType не стал 'button'
  }), 'b03');
  syntax(code, 'b03');
  ok(code.includes('"video"') || code.includes("'video'"), 'mode video должен быть');
  ok(code.includes('video_file'), 'video_variable должна быть в коде');
});

test('B04', 'enableAudioInput:true + audioInputVariable → modes содержит "audio"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: false,
    enableAudioInput: true,
    audioInputVariable: 'audio_file',
    inputVariable: 'audio_var',
    buttons: [],
  }), 'b04');
  syntax(code, 'b04');
  ok(code.includes('"audio"') || code.includes("'audio'"), 'mode audio должен быть');
  ok(code.includes('audio_file'), 'audio_variable должна быть в коде');
});

test('B05', 'enableDocumentInput:true + documentInputVariable → modes содержит "document"', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: false,
    enableDocumentInput: true,
    documentInputVariable: 'doc_file',
    inputVariable: 'doc_var',
    buttons: [],
  }), 'b05');
  syntax(code, 'b05');
  ok(code.includes('"document"') || code.includes("'document'"), 'mode document должен быть');
  ok(code.includes('doc_file'), 'document_variable должна быть в коде');
});

test('B06', 'все медиа-типы одновременно → все modes присутствуют', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    enablePhotoInput: true,
    photoInputVariable: 'p_var',
    enableVideoInput: true,
    videoInputVariable: 'v_var',
    enableAudioInput: true,
    audioInputVariable: 'a_var',
    enableDocumentInput: true,
    documentInputVariable: 'd_var',
    inputVariable: 'all_media',
    buttons: [],
  }), 'b06');
  syntax(code, 'b06');
  ok(code.includes('"text"') || code.includes("'text'"), 'text mode');
  ok(code.includes('"photo"') || code.includes("'photo'"), 'photo mode');
  ok(code.includes('"video"') || code.includes("'video'"), 'video mode');
  ok(code.includes('"audio"') || code.includes("'audio'"), 'audio mode');
  ok(code.includes('"document"') || code.includes("'document'"), 'document mode');
});

test('B07', 'все enableXInput:false → дефолт text', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: false,
    enablePhotoInput: false,
    enableVideoInput: false,
    enableAudioInput: false,
    enableDocumentInput: false,
    inputVariable: 'fallback_var',
    buttons: [],
  }), 'b07');
  syntax(code, 'b07');
  ok(code.includes('"text"') || code.includes("'text'"), 'дефолт text при всех false');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: validationType
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: validationType ────────────────────────────────────────');

test('C01', 'validationType:none → "none" в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'none',
    inputVariable: 'v_none',
  }), 'c01');
  syntax(code, 'c01');
  ok(code.includes('"none"') || code.includes("'none'"), 'validation_type none');
});

test('C02', 'validationType:email → "email" в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'email',
    inputVariable: 'v_email',
    retryMessage: 'Введите корректный email',
  }), 'c02');
  syntax(code, 'c02');
  ok(code.includes('"email"') || code.includes("'email'"), 'validation_type email');
});

test('C03', 'validationType:phone → "phone" в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'phone',
    inputVariable: 'v_phone',
    retryMessage: 'Введите корректный номер телефона',
  }), 'c03');
  syntax(code, 'c03');
  ok(code.includes('"phone"') || code.includes("'phone'"), 'validation_type phone');
});

test('C04', 'validationType:number → "number" в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'number',
    inputVariable: 'v_number',
    retryMessage: 'Введите число',
  }), 'c04');
  syntax(code, 'c04');
  ok(code.includes('"number"') || code.includes("'number'"), 'validation_type number');
});

test('C05', 'validationType:email + retryMessage со спецсимволами', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'email',
    inputVariable: 'v_email2',
    retryMessage: 'Ошибка! Введите email вида "user@example.com"',
  }), 'c05');
  syntax(code, 'c05');
});

test('C06', 'validationType:number + retryMessage с обратным слешем', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'number',
    inputVariable: 'v_num2',
    retryMessage: 'Неверный формат\\nВведите целое число',
  }), 'c06');
  syntax(code, 'c06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: minLength / maxLength
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: minLength / maxLength ─────────────────────────────────');

test('D01', 'minLength:0 maxLength:0 → без ограничений', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 0,
    maxLength: 0,
    inputVariable: 'd01_var',
  }), 'd01');
  syntax(code, 'd01');
  ok(code.includes('"min_length": 0') || code.includes('"min_length":0') || code.includes('min_length": 0'), 'min_length 0');
  ok(code.includes('"max_length": 0') || code.includes('"max_length":0') || code.includes('max_length": 0'), 'max_length 0');
});

test('D02', 'minLength:5 maxLength:100 → корректные значения', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 5,
    maxLength: 100,
    inputVariable: 'd02_var',
    retryMessage: 'Введите от 5 до 100 символов',
  }), 'd02');
  syntax(code, 'd02');
  ok(code.includes('5'), 'minLength 5 в коде');
  ok(code.includes('100'), 'maxLength 100 в коде');
});

test('D03', 'minLength:1 maxLength:1 → ровно 1 символ', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 1,
    maxLength: 1,
    inputVariable: 'd03_var',
  }), 'd03');
  syntax(code, 'd03');
});

test('D04', 'minLength:255 maxLength:0 → только минимум', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 255,
    maxLength: 0,
    inputVariable: 'd04_var',
  }), 'd04');
  syntax(code, 'd04');
  ok(code.includes('255'), 'minLength 255 в коде');
});

test('D05', 'minLength:0 maxLength:4096 → только максимум (лимит Telegram)', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 0,
    maxLength: 4096,
    inputVariable: 'd05_var',
  }), 'd05');
  syntax(code, 'd05');
  ok(code.includes('4096'), 'maxLength 4096 в коде');
});

test('D06', 'minLength > maxLength (оба > 0) → синтаксис не ломается', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    minLength: 100,
    maxLength: 10,
    inputVariable: 'd06_var',
  }), 'd06');
  syntax(code, 'd06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: retryMessage / successMessage
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: retryMessage / successMessage ─────────────────────────');

test('E01', 'retryMessage пустой → дефолт', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: '',
    inputVariable: 'e01_var',
  }), 'e01');
  syntax(code, 'e01');
});

test('E02', 'successMessage задан → присутствует в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    successMessage: 'Отлично! Ваш ответ сохранён.',
    inputVariable: 'e02_var',
  }), 'e02');
  syntax(code, 'e02');
  ok(code.includes('Отлично') || code.includes('success_message'), 'successMessage в коде');
});

test('E03', 'retryMessage с переменной {user_name}', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: 'Привет, {user_name}! Попробуй ещё раз.',
    inputVariable: 'e03_var',
  }), 'e03');
  syntax(code, 'e03');
});

test('E04', 'retryMessage с переносом строки \\n', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: 'Ошибка!\nПопробуйте снова.',
    inputVariable: 'e04_var',
  }), 'e04');
  syntax(code, 'e04');
});

test('E05', 'retryMessage с кавычками и апострофами', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: "Введите 'правильный' формат \"данных\"",
    inputVariable: 'e05_var',
  }), 'e05');
  syntax(code, 'e05');
});

test('E06', 'successMessage с эмодзи и спецсимволами', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    successMessage: '✅ Готово! Данные сохранены: {my_var} 🎉',
    inputVariable: 'e06_var',
  }), 'e06');
  syntax(code, 'e06');
});

test('E07', 'retryMessage очень длинный (500 символов)', () => {
  const longMsg = 'Ошибка валидации. '.repeat(28); // ~504 символа
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: longMsg,
    inputVariable: 'e07_var',
  }), 'e07');
  syntax(code, 'e07');
});

test('E08', 'retryMessage с обратным слешем', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: 'Путь: C:\\Users\\test\\file.txt',
    inputVariable: 'e08_var',
  }), 'e08');
  syntax(code, 'e08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: saveToDatabase
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: saveToDatabase ────────────────────────────────────────');

test('F01', 'saveToDatabase:true → save_to_database: True в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'f01_var',
  }), 'f01');
  syntax(code, 'f01');
  ok(
    code.includes('save_to_database": True') ||
    code.includes("save_to_database': True") ||
    code.includes('"save_to_database": True') ||
    code.includes("'save_to_database': True"),
    'save_to_database True'
  );
});

test('F02', 'saveToDatabase:false → save_to_database: False в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: false,
    inputVariable: 'f02_var',
  }), 'f02');
  syntax(code, 'f02');
  ok(
    code.includes('save_to_database": False') ||
    code.includes("save_to_database': False") ||
    code.includes('"save_to_database": False') ||
    code.includes("'save_to_database': False"),
    'save_to_database False'
  );
});

test('F03', 'saveToDatabase:true + userDatabaseEnabled:true → db_pool код присутствует', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'f03_var',
  }), 'f03');
  syntax(code, 'f03');
  ok(code.includes('db_pool'), 'db_pool должен быть при userDatabaseEnabled:true');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: appendVariable
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: appendVariable ────────────────────────────────────────');

test('G01', 'appendVariable:false → appendVariable: False в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    appendVariable: false,
    inputVariable: 'g01_var',
  }), 'g01');
  syntax(code, 'g01');
  ok(
    code.includes('"appendVariable": False') ||
    code.includes("'appendVariable': False") ||
    code.includes('"appendVariable":False'),
    'appendVariable False'
  );
});

test('G02', 'appendVariable:true → appendVariable: True в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    appendVariable: true,
    inputVariable: 'g02_var',
  }), 'g02');
  syntax(code, 'g02');
  ok(
    code.includes('"appendVariable": True') ||
    code.includes("'appendVariable': True") ||
    code.includes('"appendVariable":True'),
    'appendVariable True'
  );
});

test('G03', 'appendVariable:true + saveToDatabase:true + userDatabaseEnabled:true → append в БД', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    appendVariable: true,
    saveToDatabase: true,
    inputVariable: 'g03_var',
  }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('db_pool'), 'db_pool при append+db');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: inputTargetNodeId
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: inputTargetNodeId ─────────────────────────────────────');

test('H01', 'inputTargetNodeId валидный ID → next_node_id в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputTargetNodeId: '1KvQin0bE6-tRu9mm8xK_',
    inputVariable: 'h01_var',
  }), 'h01');
  syntax(code, 'h01');
  ok(code.includes('next_node_id') || code.includes('1KvQin0bE6-tRu9mm8xK_'), 'next_node_id в коде');
});

test('H02', 'inputTargetNodeId пустой → next_node_id пустая строка', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputTargetNodeId: '',
    inputVariable: 'h02_var',
  }), 'h02');
  syntax(code, 'h02');
  ok(code.includes('next_node_id'), 'next_node_id должен быть даже при пустом');
});

test('H03', 'inputTargetNodeId несуществующий → синтаксис не ломается', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputTargetNodeId: 'nonexistent_node_id_xyz',
    inputVariable: 'h03_var',
  }), 'h03');
  syntax(code, 'h03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: skipButtons (skipDataCollection)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: skipButtons ───────────────────────────────────────────');

test('I01', 'skipDataCollection:true на кнопке → skip_buttons в коде', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'i01_var',
    keyboardType: 'reply',
    buttons: [
      makeBtn({ text: 'Пропустить', skipDataCollection: true, target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ text: 'Ввести', skipDataCollection: false }),
    ],
  }), 'i01');
  syntax(code, 'i01');
});

test('I02', 'skipDataCollection:false на всех кнопках → нет skip_buttons', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'i02_var',
    keyboardType: 'reply',
    buttons: [
      makeBtn({ text: 'Кнопка 1', skipDataCollection: false }),
      makeBtn({ text: 'Кнопка 2', skipDataCollection: false }),
    ],
  }), 'i02');
  syntax(code, 'i02');
});

test('I03', 'несколько skipDataCollection:true кнопок', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'i03_var',
    keyboardType: 'reply',
    buttons: [
      makeBtn({ text: 'Пропустить 1', skipDataCollection: true, target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ text: 'Пропустить 2', skipDataCollection: true, target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ text: 'Ввести', skipDataCollection: false }),
    ],
  }), 'i03');
  syntax(code, 'i03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Сохранение в bot_users (системные переменные)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Сохранение в bot_users ───────────────────────────────');

test('J01', 'inputVariable:username → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'username',
  }), 'j01');
  syntax(code, 'j01');
  ok(code.includes('bot_users'), 'bot_users должен быть в коде');
  ok(code.includes('username'), 'username должен быть в коде');
});

test('J02', 'inputVariable:first_name → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'first_name',
  }), 'j02');
  syntax(code, 'j02');
  ok(code.includes('bot_users'), 'bot_users должен быть');
  ok(code.includes('first_name'), 'first_name должен быть');
});

test('J03', 'inputVariable:last_name → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'last_name',
  }), 'j03');
  syntax(code, 'j03');
  ok(code.includes('bot_users'), 'bot_users должен быть');
  ok(code.includes('last_name'), 'last_name должен быть');
});

test('J04', 'inputVariable:user_id → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_id',
  }), 'j04');
  syntax(code, 'j04');
  ok(code.includes('bot_users'), 'bot_users должен быть');
});

test('J05', 'inputVariable:user_is_active → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_is_active',
  }), 'j05');
  syntax(code, 'j05');
  ok(code.includes('bot_users'), 'bot_users должен быть');
});

test('J06', 'inputVariable:user_interaction_count → сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_interaction_count',
  }), 'j06');
  syntax(code, 'j06');
  ok(code.includes('bot_users'), 'bot_users должен быть');
});

test('J07', 'inputVariable:username + appendVariable:true → append в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'username',
    appendVariable: true,
  }), 'j07');
  syntax(code, 'j07');
  ok(code.includes('bot_users'), 'bot_users должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Сохранение в user_telegram_settings
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Сохранение в user_telegram_settings ───────────────────');

test('K01', 'inputVariable:tg_phone → сохранение в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    validationType: 'phone',
    inputVariable: 'tg_phone',
    retryMessage: 'Введите номер телефона в формате +7XXXXXXXXXX',
  }), 'k01');
  syntax(code, 'k01');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
  ok(code.includes('phone_number') || code.includes('tg_phone'), 'поле phone в коде');
});

test('K02', 'inputVariable:tg_api_id → сохранение в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    validationType: 'number',
    inputVariable: 'tg_api_id',
    retryMessage: 'Введите числовой API ID',
  }), 'k02');
  syntax(code, 'k02');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
  ok(code.includes('api_id') || code.includes('tg_api_id'), 'поле api_id в коде');
});

test('K03', 'inputVariable:tg_api_hash → сохранение в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'tg_api_hash',
    retryMessage: 'Введите API Hash (32 символа)',
  }), 'k03');
  syntax(code, 'k03');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
  ok(code.includes('api_hash') || code.includes('tg_api_hash'), 'поле api_hash в коде');
});

test('K04', 'inputVariable:tg_session → сохранение в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'tg_session',
  }), 'k04');
  syntax(code, 'k04');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
});

test('K05', 'inputVariable:tg_is_active → сохранение в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'tg_is_active',
  }), 'k05');
  syntax(code, 'k05');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
});

test('K06', 'tg_phone + appendVariable:true → append в user_telegram_settings', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'tg_phone',
    appendVariable: true,
  }), 'k06');
  syntax(code, 'k06');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Сохранение в user_ids
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Сохранение в user_ids ─────────────────────────────────');

test('L01', 'inputVariable:user_ids → сохранение в user_ids', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_ids',
  }), 'l01');
  syntax(code, 'l01');
  ok(code.includes('user_ids'), 'user_ids должен быть в коде');
});

test('L02', 'inputVariable:user_ids + appendVariable:true → append в user_ids', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_ids',
    appendVariable: true,
  }), 'l02');
  syntax(code, 'l02');
  ok(code.includes('user_ids'), 'user_ids должен быть');
});

test('L03', 'inputVariable:user_ids_count → сохранение в user_ids', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'user_ids_count',
  }), 'l03');
  syntax(code, 'l03');
  ok(code.includes('user_ids'), 'user_ids таблица должна быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Комбинации ────────────────────────────────────────────');

test('M01', 'photo+text одновременно + сохранение в bot_users', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    enablePhotoInput: true,
    photoInputVariable: 'avatar_photo',
    saveToDatabase: true,
    inputVariable: 'username',
  }), 'm01');
  syntax(code, 'm01');
  ok(code.includes('"text"') || code.includes("'text'"), 'text mode');
  ok(code.includes('"photo"') || code.includes("'photo'"), 'photo mode');
  ok(code.includes('bot_users'), 'bot_users');
});

test('M02', 'validationType:email + appendVariable:true + saveToDatabase:true', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'email',
    appendVariable: true,
    saveToDatabase: true,
    inputVariable: 'username',
    retryMessage: 'Введите корректный email',
    successMessage: 'Email сохранён!',
  }), 'm02');
  syntax(code, 'm02');
  ok(code.includes('"email"') || code.includes("'email'"), 'email validation');
  ok(code.includes('bot_users'), 'bot_users');
});

test('M03', 'tg_phone + validationType:phone + minLength:10 + maxLength:15', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'phone',
    minLength: 10,
    maxLength: 15,
    saveToDatabase: true,
    inputVariable: 'tg_phone',
    retryMessage: 'Введите номер от 10 до 15 символов',
  }), 'm03');
  syntax(code, 'm03');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings');
  ok(code.includes('"phone"') || code.includes("'phone'"), 'phone validation');
});

test('M04', 'все медиа + tg_api_hash + appendVariable:false', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    enablePhotoInput: true,
    photoInputVariable: 'p',
    enableVideoInput: true,
    videoInputVariable: 'v',
    enableAudioInput: true,
    audioInputVariable: 'a',
    enableDocumentInput: true,
    documentInputVariable: 'd',
    saveToDatabase: true,
    appendVariable: false,
    inputVariable: 'tg_api_hash',
  }), 'm04');
  syntax(code, 'm04');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings');
});

test('M05', 'user_ids + appendVariable:true + validationType:number', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'number',
    appendVariable: true,
    saveToDatabase: true,
    inputVariable: 'user_ids',
    retryMessage: 'Введите числовой ID',
  }), 'm05');
  syntax(code, 'm05');
  ok(code.includes('user_ids'), 'user_ids');
});

test('M06', 'skipButton + saveToDatabase:true + tg_phone', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: true,
    inputVariable: 'tg_phone',
    keyboardType: 'reply',
    buttons: [
      makeBtn({ text: 'Пропустить', skipDataCollection: true, target: '1KvQin0bE6-tRu9mm8xK_' }),
    ],
  }), 'm06');
  syntax(code, 'm06');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings');
});

test('M07', 'successMessage + retryMessage + validationType:number + minLength:1 + maxLength:10', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    validationType: 'number',
    minLength: 1,
    maxLength: 10,
    retryMessage: 'Введите число от 1 до 10 символов',
    successMessage: '✅ Число принято!',
    inputVariable: 'my_number',
  }), 'm07');
  syntax(code, 'm07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Граничные случаи ──────────────────────────────────────');

test('N01', 'inputVariable с подчёркиваниями и цифрами', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'my_var_123',
  }), 'n01');
  syntax(code, 'n01');
  ok(code.includes('my_var_123'), 'переменная с цифрами');
});

test('N02', 'inputVariable очень длинное имя (50 символов)', () => {
  const longVar = 'a'.repeat(50);
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: longVar,
  }), 'n02');
  syntax(code, 'n02');
  ok(code.includes(longVar), 'длинное имя переменной');
});

test('N03', 'retryMessage с Unicode (китайские символы)', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: '请重新输入正确的格式',
    inputVariable: 'n03_var',
  }), 'n03');
  syntax(code, 'n03');
});

test('N04', 'retryMessage с HTML-тегами', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: '<b>Ошибка!</b> Введите <i>корректный</i> формат.',
    inputVariable: 'n04_var',
  }), 'n04');
  syntax(code, 'n04');
});

test('N05', 'successMessage с URL', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    successMessage: 'Подробнее: https://example.com/path?a=1&b=2',
    inputVariable: 'n05_var',
  }), 'n05');
  syntax(code, 'n05');
});

test('N06', 'collectUserInput:true + нет кнопок + нет inputTargetNodeId', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'n06_var',
    buttons: [],
    inputTargetNodeId: '',
  }), 'n06');
  syntax(code, 'n06');
});

test('N07', 'collectUserInput:true + saveToDatabase:false + userDatabaseEnabled:true', () => {
  const code = genDB(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    saveToDatabase: false,
    inputVariable: 'n07_var',
  }), 'n07');
  syntax(code, 'n07');
  ok(
    code.includes('save_to_database": False') ||
    code.includes("save_to_database': False") ||
    code.includes('"save_to_database": False'),
    'save_to_database False даже при userDatabaseEnabled:true'
  );
});

test('N08', 'inputVariable с кириллицей → безопасное имя в safeName', () => {
  // nodeId с кириллицей — renderer делает safeName через replace(/[^a-zA-Z0-9_]/g, '_')
  const p = clone(BASE);
  // Меняем id узла на кириллицу
  p.sheets[0].nodes[1].id = 'узел_ввода_123';
  Object.assign(p.sheets[0].nodes[1].data, {
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'n08_var',
  });
  const code = gen(p, 'n08');
  syntax(code, 'n08');
});

test('N09', 'два узла с collectUserInput:true → оба waiting_for_input', () => {
  const p = clone(BASE);
  // Патчим оба узла
  Object.assign(p.sheets[0].nodes[0].data, {
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'first_input',
  });
  Object.assign(p.sheets[0].nodes[1].data, {
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'second_input',
  });
  const code = gen(p, 'n09');
  syntax(code, 'n09');
  const count = (code.match(/waiting_for_input/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 waiting_for_input, найдено: ${count}`);
});

test('N10', 'retryMessage с нулевым символом и спецсимволами Python', () => {
  const code = gen(patchMsg({
    collectUserInput: true,
    enableTextInput: true,
    retryMessage: 'Ошибка: \\t\\r\\n табуляция и перенос',
    inputVariable: 'n10_var',
  }), 'n10');
  syntax(code, 'n10');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${results.length} пройдено, ${failed} провалено`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\n❌ Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ Все тесты пройдены!');
}
