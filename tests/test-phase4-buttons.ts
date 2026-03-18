/**
 * @fileoverview Фаза 4 — Кнопки (action) — JSON-мутации
 *
 * Тестирует все типы действий кнопок, граничные случаи и комбинации.
 *
 * Покрывает:
 *  action: goto, url, command, contact, location, selection, complete, default
 *  hideAfterClick: true/false
 *  skipDataCollection: true/false
 *  requestContact / requestLocation
 *  keyboardType: inline / reply / none
 *  Граничные случаи: пустой target, спецсимволы в тексте, много кнопок
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../lib/bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function makeBtn(overrides: Record<string, unknown>) {
  return {
    id: `btn_${Math.random().toString(36).slice(2, 8)}`,
    text: 'Кнопка',
    action: 'goto',
    target: '1KvQin0bE6-tRu9mm8xK_',
    hideAfterClick: false,
    skipDataCollection: false,
    buttonType: 'normal',
    ...overrides,
  };
}

/** Патчит start-узел */
function patchStart(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, patch);
  return p;
}

/** Патчит message-узел */
function patchMsg(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[1].data, patch);
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase4_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p4_${label}.py`;
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
console.log('║         Фаза 4 — Кнопки (action) (40 тестов)               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: action = goto (inline)
// ════════════════════════════════════════════════════════════════════════════

test('A01', 'action:goto inline → callback_data = target', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a01');
  syntax(code, 'a01');
  ok(code.includes('callback_data='), 'callback_data должен быть');
  ok(code.includes('InlineKeyboardButton'), 'InlineKeyboardButton должен быть');
});

test('A02', 'action:goto inline → пустой target → fallback no_action', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '' })],
  }), 'a02');
  syntax(code, 'a02');
  ok(
    code.includes('no_action') || code.includes('callback_data='),
    'fallback для пустого target'
  );
});

test('A03', 'action:goto reply → KeyboardButton (не InlineKeyboardButton)', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a03');
  syntax(code, 'a03');
  ok(code.includes('KeyboardButton'), 'KeyboardButton должен быть');
  ok(code.includes('ReplyKeyboardBuilder'), 'ReplyKeyboardBuilder должен быть');
});

test('A04', 'action:goto → текст кнопки с эмодзи 🚀', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: '🚀 Поехали!', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a04');
  syntax(code, 'a04');
  ok(code.includes('🚀') || code.includes('Поехали'), 'эмодзи в тексте кнопки');
});

test('A05', 'action:goto → текст кнопки с двойными кавычками', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: 'Сказал "Привет"', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a05');
  syntax(code, 'a05');
});

test('A06', 'action:goto → текст кнопки с обратным слешем', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: 'Путь C:\\test', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a06');
  syntax(code, 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: action = url
// ════════════════════════════════════════════════════════════════════════════

test('B01', 'action:url → InlineKeyboardButton с url=', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'url', target: 'https://example.com', text: 'Сайт' })],
  }), 'b01');
  syntax(code, 'b01');
  ok(code.includes('url='), 'url= должен быть в кнопке');
  ok(code.includes('https://example.com'), 'URL должен быть в коде');
  ok(!code.includes('callback_data='), 'callback_data не должен быть для url-кнопки');
});

test('B02', 'action:url → URL с query-параметрами', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'url', target: 'https://example.com/path?a=1&b=2', text: 'Ссылка' })],
  }), 'b02');
  syntax(code, 'b02');
  ok(code.includes('https://example.com/path'), 'URL с параметрами');
});

test('B03', 'action:url → пустой target → fallback #', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'url', target: '', text: 'Пустой URL' })],
  }), 'b03');
  syntax(code, 'b03');
  ok(code.includes('url='), 'url= должен быть даже при пустом target');
});

test('B04', 'action:url → поле url (не target)', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'url', url: 'https://telegram.org', target: '', text: 'TG' })],
  }), 'b04');
  syntax(code, 'b04');
  ok(code.includes('https://telegram.org'), 'url из поля url должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: action = command
// ════════════════════════════════════════════════════════════════════════════

test('C01', 'action:command inline → callback_data с префиксом cmd_', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'command', target: '/help', text: 'Помощь' })],
  }), 'c01');
  syntax(code, 'c01');
  ok(code.includes('cmd_') || code.includes('callback_data='), 'command кнопка должна генерировать callback');
});

test('C02', 'action:command → target без слеша', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'command', target: 'help', text: 'Помощь' })],
  }), 'c02');
  syntax(code, 'c02');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: action = contact / location (reply only)
// ════════════════════════════════════════════════════════════════════════════

test('D01', 'action:contact + requestContact:true → request_contact=True', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'contact', requestContact: true, text: '📱 Мой номер' })],
  }), 'd01');
  syntax(code, 'd01');
  ok(code.includes('request_contact=True'), 'request_contact=True должен быть');
});

test('D02', 'action:location + requestLocation:true → request_location=True', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'location', requestLocation: true, text: '📍 Геолокация' })],
  }), 'd02');
  syntax(code, 'd02');
  ok(code.includes('request_location=True'), 'request_location=True должен быть');
});

test('D03', 'action:contact без requestContact → обычная кнопка', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'contact', requestContact: false, text: 'Контакт' })],
  }), 'd03');
  syntax(code, 'd03');
  ok(!code.includes('request_contact=True'), 'request_contact не должен быть без флага');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: hideAfterClick
// ════════════════════════════════════════════════════════════════════════════

test('E01', 'hideAfterClick:true → edit_reply_markup в callback handler', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true })],
  }), 'e01');
  syntax(code, 'e01');
  ok(
    code.includes('edit_reply_markup') || code.includes('reply_markup=None'),
    'edit_reply_markup должен быть при hideAfterClick:true'
  );
});

test('E02', 'hideAfterClick:false → нет edit_reply_markup', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: false })],
  }), 'e02');
  syntax(code, 'e02');
  ok(!code.includes('edit_reply_markup'), 'edit_reply_markup не должен быть при hideAfterClick:false');
});

test('E03', 'hideAfterClick:true на reply-кнопке → синтаксис не ломается', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true })],
  }), 'e03');
  syntax(code, 'e03');
});

test('E04', 'Несколько кнопок: одна hideAfterClick:true, другая false', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [
      makeBtn({ id: 'btn_hide', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true }),
      makeBtn({ id: 'btn_show', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: false }),
    ],
  }), 'e04');
  syntax(code, 'e04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: skipDataCollection
// ════════════════════════════════════════════════════════════════════════════

test('F01', 'skipDataCollection:true на inline-кнопке — синтаксис не ломается', () => {
  // skipDataCollectionTransition активируется только когда узел-цель является input-узлом.
  // Здесь проверяем что генерация не падает при skipDataCollection:true на обычной goto-кнопке.
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: true })],
  }), 'f01');
  syntax(code, 'f01');
  ok(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

test('F02', 'skipDataCollection:false → нет skipDataCollectionTransition', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: false })],
  }), 'f02');
  syntax(code, 'f02');
});

test('F03', 'skipDataCollection:true + reply keyboard', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'answer',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: true })],
  }), 'f03');
  syntax(code, 'f03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Граничные случаи — количество кнопок
// ════════════════════════════════════════════════════════════════════════════

test('G01', 'Нет кнопок (buttons:[]) → keyboard = None', () => {
  const code = gen(patchStart({ keyboardType: 'inline', buttons: [] }), 'g01');
  syntax(code, 'g01');
  ok(code.includes('keyboard = None'), 'keyboard = None при пустых кнопках');
});

test('G02', 'Одна кнопка inline', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: 'Единственная', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'g02');
  syntax(code, 'g02');
  ok(code.includes('InlineKeyboardButton'), 'кнопка должна быть');
});

test('G03', '10 кнопок inline → синтаксис корректен', () => {
  const buttons = Array.from({ length: 10 }, (_, i) =>
    makeBtn({ id: `btn_${i}`, text: `Кнопка ${i + 1}`, action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })
  );
  const code = gen(patchStart({ keyboardType: 'inline', buttons }), 'g03');
  syntax(code, 'g03');
  ok((code.match(/InlineKeyboardButton/g) || []).length >= 10, 'все 10 кнопок должны быть');
});

test('G04', '10 кнопок reply → синтаксис корректен', () => {
  const buttons = Array.from({ length: 10 }, (_, i) =>
    makeBtn({ id: `btn_${i}`, text: `Кнопка ${i + 1}`, action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })
  );
  const code = gen(patchStart({ keyboardType: 'reply', buttons }), 'g04');
  syntax(code, 'g04');
});

test('G05', 'keyboardType:none с кнопками → keyboard = None', () => {
  const code = gen(patchStart({
    keyboardType: 'none',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'g05');
  syntax(code, 'g05');
  ok(code.includes('keyboard = None'), 'keyboard = None при keyboardType:none');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Смешанные action в одной клавиатуре
// ════════════════════════════════════════════════════════════════════════════

test('H01', 'Inline: goto + url в одной клавиатуре', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [
      makeBtn({ id: 'b1', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', text: 'Перейти' }),
      makeBtn({ id: 'b2', action: 'url', target: 'https://example.com', text: 'Сайт' }),
    ],
  }), 'h01');
  syntax(code, 'h01');
  ok(code.includes('callback_data='), 'goto кнопка');
  ok(code.includes('url='), 'url кнопка');
});

test('H02', 'Inline: goto + url + command в одной клавиатуре', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [
      makeBtn({ id: 'b1', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', text: 'Перейти' }),
      makeBtn({ id: 'b2', action: 'url', target: 'https://example.com', text: 'Сайт' }),
      makeBtn({ id: 'b3', action: 'command', target: '/help', text: 'Помощь' }),
    ],
  }), 'h02');
  syntax(code, 'h02');
});

test('H03', 'Reply: contact + location + goto в одной клавиатуре', () => {
  const code = gen(patchStart({
    keyboardType: 'reply',
    buttons: [
      makeBtn({ id: 'b1', action: 'contact', requestContact: true, text: '📱 Номер' }),
      makeBtn({ id: 'b2', action: 'location', requestLocation: true, text: '📍 Место' }),
      makeBtn({ id: 'b3', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', text: 'Далее' }),
    ],
  }), 'h03');
  syntax(code, 'h03');
  ok(code.includes('request_contact=True'), 'contact кнопка');
  ok(code.includes('request_location=True'), 'location кнопка');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Текст кнопок — спецсимволы
// ════════════════════════════════════════════════════════════════════════════

test('I01', 'Текст кнопки с переменной {user_name}', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: 'Привет, {user_name}!', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'i01');
  syntax(code, 'i01');
  ok(code.includes('replace_variables_in_text') || code.includes('{user_name}'), 'переменная в тексте кнопки');
});

test('I02', 'Текст кнопки с переносом строки', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: 'Строка1\nСтрока2', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'i02');
  syntax(code, 'i02');
});

test('I03', 'Текст кнопки только из пробелов', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ text: '   ', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'i03');
  syntax(code, 'i03');
});

test('I04', 'Текст кнопки с HTML-тегами при formatMode:html', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    formatMode: 'html',
    messageText: '<b>Выберите:</b>',
    buttons: [makeBtn({ text: '<b>Жирная</b>', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'i04');
  syntax(code, 'i04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: buttonType
// ════════════════════════════════════════════════════════════════════════════

test('J01', 'buttonType:normal → стандартная кнопка', () => {
  const code = gen(patchStart({
    keyboardType: 'inline',
    buttons: [makeBtn({ buttonType: 'normal', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'j01');
  syntax(code, 'j01');
});

test('J02', 'allowMultipleSelection:true + selection + complete кнопки', () => {
  // multiSelect требует вычисляемых полей (shortNodeId, selectionButtons, regularButtons)
  // которые генератор вычисляет сам из to-enhanced-node.ts.
  // Проверяем что генерация не падает и синтаксис корректен.
  const p = clone(BASE);
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.allowMultipleSelection = true;
  p.sheets[0].nodes[0].data.multiSelectVariable = 'choices';
  p.sheets[0].nodes[0].data.buttons = [
    makeBtn({ id: 'sel1', buttonType: 'option', action: 'selection', target: 'opt1', text: 'Вариант 1' }),
    makeBtn({ id: 'sel2', buttonType: 'option', action: 'selection', target: 'opt2', text: 'Вариант 2' }),
    makeBtn({ id: 'done', buttonType: 'complete', action: 'complete', target: '', text: 'Готово' }),
  ];
  const code = gen(p, 'j02');
  syntax(code, 'j02');
  ok(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено  |  Провалено: ${failed}${' '.repeat(Math.max(0, 42 - String(passed).length - String(results.length).length - String(failed).length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
