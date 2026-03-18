/**
 * @fileoverview Фаза 10 — Рассылка (broadcast) — JSON-мутации
 *
 * Блок A: Bot API — idSourceType (bot_users / user_ids / both)
 * Блок B: Bot API — broadcastNodes: текст, форматирование, спецсимволы
 * Блок C: Bot API — broadcastNodes: медиа (imageUrl, videoUrl, audioUrl, documentUrl)
 * Блок D: Bot API — broadcastNodes: attachedMedia (переменные)
 * Блок E: Bot API — broadcastNodes: autoTransitionTo (цепочки)
 * Блок F: Bot API — successMessage / errorMessage
 * Блок G: Bot API — пустой broadcastNodes
 * Блок H: Bot API — collectBroadcastNodes (enableBroadcast, broadcastTargetNode)
 * Блок I: Client API — базовые случаи (broadcastApiType: "client")
 * Блок J: Client API — медиа, attachedMedia, autoTransitionTo
 * Блок K: Комбинации — несколько broadcast-узлов в одном проекте
 * Блок L: Граничные случаи — спецсимволы в nodeId, длинный текст, пустые поля
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../lib/bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

/** Добавляет broadcast-узел (Bot API по умолчанию) */
function addBroadcast(data: Record<string, unknown>) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'broadcast_test',
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: {
      broadcastApiType: 'bot',
      idSourceType: 'bot_users',
      successMessage: '',
      errorMessage: '',
      ...data,
    },
  });
  return p;
}

/** Добавляет broadcast-узел Client API */
function addBroadcastClient(data: Record<string, unknown>) {
  return addBroadcast({ broadcastApiType: 'client', ...data });
}

/** Добавляет broadcast-узел + message-узлы с enableBroadcast */
function addBroadcastWithMessages(
  broadcastData: Record<string, unknown>,
  messages: Array<{ id: string; data: Record<string, unknown> }>
) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'broadcast_test',
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: {
      broadcastApiType: 'bot',
      idSourceType: 'bot_users',
      successMessage: '',
      errorMessage: '',
      ...broadcastData,
    },
  });
  for (const msg of messages) {
    p.sheets[0].nodes.push({
      id: msg.id,
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Тест',
        keyboardType: 'none',
        buttons: [],
        enableBroadcast: true,
        ...msg.data,
      },
    });
  }
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase10_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase10DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p10_${label}.py`;
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
console.log('║         Фаза 10 — Рассылка (broadcast)                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Bot API — idSourceType
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Bot API — idSourceType ────────────────────────────────');

test('A01', 'idSourceType: bot_users → SELECT FROM bot_users', () => {
  const p = addBroadcastWithMessages(
    { idSourceType: 'bot_users' },
    [{ id: 'msg_a01', data: { messageText: 'Привет!', enableBroadcast: true } }]
  );
  const code = gen(p, 'a01');
  syntax(code, 'a01');
  ok(code.includes('SELECT DISTINCT user_id FROM bot_users'), 'должен быть SELECT FROM bot_users');
  ok(!code.includes('SELECT DISTINCT user_id FROM user_ids'), 'не должно быть SELECT FROM user_ids');
});

test('A02', 'idSourceType: user_ids → SELECT FROM user_ids', () => {
  const p = addBroadcastWithMessages(
    { idSourceType: 'user_ids' },
    [{ id: 'msg_a02', data: { messageText: 'Привет!', enableBroadcast: true } }]
  );
  const code = gen(p, 'a02');
  syntax(code, 'a02');
  ok(code.includes('SELECT DISTINCT user_id FROM user_ids'), 'должен быть SELECT FROM user_ids');
  ok(!code.includes('SELECT DISTINCT user_id FROM bot_users'), 'не должно быть SELECT FROM bot_users');
});

test('A03', 'idSourceType: both → оба SELECT', () => {
  const p = addBroadcastWithMessages(
    { idSourceType: 'both' },
    [{ id: 'msg_a03', data: { messageText: 'Привет!', enableBroadcast: true } }]
  );
  const code = gen(p, 'a03');
  syntax(code, 'a03');
  ok(code.includes('SELECT DISTINCT user_id FROM bot_users'), 'должен быть SELECT FROM bot_users');
  ok(code.includes('SELECT DISTINCT user_id FROM user_ids'), 'должен быть SELECT FROM user_ids');
});

test('A04', 'idSourceType не задан → дефолт bot_users', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_a04', data: { messageText: 'Привет!', enableBroadcast: true } }]
  );
  const code = gen(p, 'a04');
  syntax(code, 'a04');
  ok(code.includes('SELECT DISTINCT user_id FROM bot_users'), 'дефолт должен быть bot_users');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Bot API — текст broadcastNodes
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Bot API — текст broadcastNodes ────────────────────────');

test('B01', 'один узел с текстом → текст в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b01', data: { messageText: 'Привет от рассылки!', enableBroadcast: true } }]
  );
  const code = gen(p, 'b01');
  syntax(code, 'b01');
  ok(code.includes('Привет от рассылки!'), 'текст должен быть в broadcast_nodes');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть в коде');
});

test('B02', 'текст с переменной {user_name} → replace_variables_in_text', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b02', data: { messageText: 'Привет, {user_name}!', enableBroadcast: true } }]
  );
  const code = gen(p, 'b02');
  syntax(code, 'b02');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
  ok(code.includes('user_name'), 'переменная user_name должна быть в коде');
});

test('B03', 'текст с HTML-тегами + formatMode: html → "html" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b03', data: { messageText: '<b>Жирный</b> текст', enableBroadcast: true, formatMode: 'html' } }]
  );
  const code = gen(p, 'b03');
  syntax(code, 'b03');
  ok(code.includes('"html"'), '"html" должен быть в broadcast_nodes');
  ok(code.includes('Жирный'), 'текст должен быть в коде');
});

test('B04', 'текст с кириллицей и эмодзи → синтаксис не ломается', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b04', data: { messageText: 'Привет! 🎉 Добро пожаловать 🚀', enableBroadcast: true } }]
  );
  const code = gen(p, 'b04');
  syntax(code, 'b04');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть');
});

test('B05', 'текст с двойными кавычками → синтаксис не ломается', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b05', data: { messageText: 'Он сказал "привет" всем', enableBroadcast: true } }]
  );
  const code = gen(p, 'b05');
  syntax(code, 'b05');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть');
});

test('B06', 'текст с одинарными кавычками → синтаксис не ломается', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b06', data: { messageText: "Он сказал 'привет' всем", enableBroadcast: true } }]
  );
  const code = gen(p, 'b06');
  syntax(code, 'b06');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть');
});

test('B07', 'текст с обратным слешем → синтаксис не ломается', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b07', data: { messageText: 'Путь: C:\\Users\\test', enableBroadcast: true } }]
  );
  const code = gen(p, 'b07');
  syntax(code, 'b07');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть');
});

test('B08', 'пустой текст в узле → узел присутствует в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_b08', data: { messageText: '', enableBroadcast: true } }]
  );
  const code = gen(p, 'b08');
  syntax(code, 'b08');
  ok(code.includes('broadcast_nodes'), 'broadcast_nodes должен быть в коде');
});

test('B09', 'несколько узлов → все в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [
      { id: 'msg_b09a', data: { messageText: 'Первое сообщение', enableBroadcast: true } },
      { id: 'msg_b09b', data: { messageText: 'Второе сообщение', enableBroadcast: true } },
      { id: 'msg_b09c', data: { messageText: 'Третье сообщение', enableBroadcast: true } },
    ]
  );
  const code = gen(p, 'b09');
  syntax(code, 'b09');
  ok(code.includes('Первое сообщение'), 'первое сообщение должно быть');
  ok(code.includes('Второе сообщение'), 'второе сообщение должно быть');
  ok(code.includes('Третье сообщение'), 'третье сообщение должно быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Bot API — медиа в broadcastNodes
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Bot API — медиа в broadcastNodes ──────────────────────');

test('C01', 'imageUrl → "imageUrl" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_c01', data: { messageText: 'Фото', enableBroadcast: true, imageUrl: 'https://example.com/photo.jpg' } }]
  );
  const code = gen(p, 'c01');
  syntax(code, 'c01');
  ok(code.includes('https://example.com/photo.jpg'), 'imageUrl должен быть в broadcast_nodes');
  ok(code.includes('"imageUrl"'), '"imageUrl" ключ должен быть');
});

test('C02', 'videoUrl → "videoUrl" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_c02', data: { messageText: 'Видео', enableBroadcast: true, videoUrl: 'https://example.com/video.mp4' } }]
  );
  const code = gen(p, 'c02');
  syntax(code, 'c02');
  ok(code.includes('https://example.com/video.mp4'), 'videoUrl должен быть в broadcast_nodes');
  ok(code.includes('"videoUrl"'), '"videoUrl" ключ должен быть');
});

test('C03', 'audioUrl → "audioUrl" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_c03', data: { messageText: 'Аудио', enableBroadcast: true, audioUrl: 'https://example.com/audio.mp3' } }]
  );
  const code = gen(p, 'c03');
  syntax(code, 'c03');
  ok(code.includes('https://example.com/audio.mp3'), 'audioUrl должен быть в broadcast_nodes');
  ok(code.includes('"audioUrl"'), '"audioUrl" ключ должен быть');
});

test('C04', 'documentUrl → "documentUrl" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_c04', data: { messageText: 'Документ', enableBroadcast: true, documentUrl: 'https://example.com/doc.pdf' } }]
  );
  const code = gen(p, 'c04');
  syntax(code, 'c04');
  ok(code.includes('https://example.com/doc.pdf'), 'documentUrl должен быть в broadcast_nodes');
  ok(code.includes('"documentUrl"'), '"documentUrl" ключ должен быть');
});

test('C05', 'все медиа одновременно → все поля в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{
      id: 'msg_c05',
      data: {
        messageText: 'Все медиа',
        enableBroadcast: true,
        imageUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        audioUrl: 'https://example.com/audio.mp3',
        documentUrl: 'https://example.com/doc.pdf',
      }
    }]
  );
  const code = gen(p, 'c05');
  syntax(code, 'c05');
  ok(code.includes('https://example.com/photo.jpg'), 'imageUrl должен быть');
  ok(code.includes('https://example.com/video.mp4'), 'videoUrl должен быть');
  ok(code.includes('https://example.com/audio.mp3'), 'audioUrl должен быть');
  ok(code.includes('https://example.com/doc.pdf'), 'documentUrl должен быть');
});

test('C06', 'медиа пустые → пустые строки в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{
      id: 'msg_c06',
      data: {
        messageText: 'Без медиа',
        enableBroadcast: true,
        imageUrl: '',
        videoUrl: '',
        audioUrl: '',
        documentUrl: '',
      }
    }]
  );
  const code = gen(p, 'c06');
  syntax(code, 'c06');
  ok(code.includes('"imageUrl": ""'), 'пустой imageUrl должен быть в broadcast_nodes');
  ok(code.includes('"videoUrl": ""'), 'пустой videoUrl должен быть в broadcast_nodes');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Bot API — attachedMedia в broadcastNodes
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Bot API — attachedMedia в broadcastNodes ──────────────');

test('D01', 'attachedMedia: [imageUrlVar] → "attachedMedia": ["imageUrlVar"] в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_d01', data: { messageText: 'Медиа', enableBroadcast: true, attachedMedia: ['imageUrlVar'] } }]
  );
  const code = gen(p, 'd01');
  syntax(code, 'd01');
  ok(code.includes('"imageUrlVar"'), '"imageUrlVar" должен быть в broadcast_nodes');
  ok(code.includes('"attachedMedia"'), '"attachedMedia" ключ должен быть');
});

test('D02', 'attachedMedia: [videoUrlVar, audioUrlVar] → оба в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_d02', data: { messageText: 'Медиа', enableBroadcast: true, attachedMedia: ['videoUrlVar', 'audioUrlVar'] } }]
  );
  const code = gen(p, 'd02');
  syntax(code, 'd02');
  ok(code.includes('"videoUrlVar"'), '"videoUrlVar" должен быть');
  ok(code.includes('"audioUrlVar"'), '"audioUrlVar" должен быть');
});

test('D03', 'attachedMedia: [] → "attachedMedia": [] в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_d03', data: { messageText: 'Без медиа', enableBroadcast: true, attachedMedia: [] } }]
  );
  const code = gen(p, 'd03');
  syntax(code, 'd03');
  ok(code.includes('"attachedMedia": []'), '"attachedMedia": [] должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Bot API — autoTransitionTo
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Bot API — autoTransitionTo ────────────────────────────');

test('E01', 'один узел с autoTransitionTo: msg_b → "autoTransitionTo": "msg_b" в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_e01', data: { messageText: 'Первое', enableBroadcast: true, autoTransitionTo: 'msg_b' } }]
  );
  const code = gen(p, 'e01');
  syntax(code, 'e01');
  ok(code.includes('"autoTransitionTo": "msg_b"'), '"autoTransitionTo": "msg_b" должен быть');
});

test('E02', 'цепочка A→B→C (три узла) → все три в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [
      { id: 'msg_e02a', data: { messageText: 'Узел A', enableBroadcast: true, autoTransitionTo: 'msg_e02b' } },
      { id: 'msg_e02b', data: { messageText: 'Узел B', enableBroadcast: false, autoTransitionTo: 'msg_e02c' } },
      { id: 'msg_e02c', data: { messageText: 'Узел C', enableBroadcast: false } },
    ]
  );
  const code = gen(p, 'e02');
  syntax(code, 'e02');
  ok(code.includes('Узел A'), 'Узел A должен быть в broadcast_nodes');
  ok(code.includes('Узел B'), 'Узел B должен быть (разворачивается из цепочки)');
  ok(code.includes('Узел C'), 'Узел C должен быть (разворачивается из цепочки)');
});

test('E03', 'autoTransitionTo: "" → пустая строка в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_e03', data: { messageText: 'Без перехода', enableBroadcast: true, autoTransitionTo: '' } }]
  );
  const code = gen(p, 'e03');
  syntax(code, 'e03');
  ok(code.includes('"autoTransitionTo": ""'), '"autoTransitionTo": "" должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Bot API — successMessage / errorMessage
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Bot API — successMessage / errorMessage ───────────────');

test('F01', 'successMessage: "Готово!" → "Готово!" в коде', () => {
  const p = addBroadcastWithMessages(
    { successMessage: 'Готово!' },
    [{ id: 'msg_f01', data: { messageText: 'Текст', enableBroadcast: true } }]
  );
  const code = gen(p, 'f01');
  syntax(code, 'f01');
  ok(code.includes('Готово!'), 'successMessage должен быть в коде');
});

test('F02', 'errorMessage: "Упс!" → "Упс!" в коде', () => {
  const p = addBroadcastWithMessages(
    { errorMessage: 'Упс!' },
    [{ id: 'msg_f02', data: { messageText: 'Текст', enableBroadcast: true } }]
  );
  const code = gen(p, 'f02');
  syntax(code, 'f02');
  ok(code.includes('Упс!'), 'errorMessage должен быть в коде');
});

test('F03', 'оба не заданы → дефолтные сообщения', () => {
  const p = addBroadcastWithMessages(
    { successMessage: '', errorMessage: '' },
    [{ id: 'msg_f03', data: { messageText: 'Текст', enableBroadcast: true } }]
  );
  const code = gen(p, 'f03');
  syntax(code, 'f03');
  ok(code.includes('✅ Рассылка отправлена!'), 'дефолтный successMessage должен быть');
  ok(code.includes('❌ Ошибка рассылки'), 'дефолтный errorMessage должен быть');
});

test('F04', 'successMessage со спецсимволами Python → синтаксис не ломается', () => {
  const p = addBroadcastWithMessages(
    { successMessage: 'Готово! "Успех" \\n Строка 2' },
    [{ id: 'msg_f04', data: { messageText: 'Текст', enableBroadcast: true } }]
  );
  const code = gen(p, 'f04');
  syntax(code, 'f04');
  ok(code.includes('handle_broadcast_'), 'обработчик должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Bot API — пустой broadcastNodes
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Bot API — пустой broadcastNodes ───────────────────────');

test('G01', 'нет message-узлов → broadcast_nodes = []', () => {
  const p = addBroadcast({ idSourceType: 'bot_users' });
  const code = gen(p, 'g01');
  syntax(code, 'g01');
  ok(code.includes('broadcast_nodes = []'), 'broadcast_nodes = [] должен быть');
});

test('G02', 'message-узлы без enableBroadcast → broadcast_nodes = []', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'broadcast_test',
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: { broadcastApiType: 'bot', idSourceType: 'bot_users', successMessage: '', errorMessage: '' },
  });
  p.sheets[0].nodes.push({
    id: 'msg_g02',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Без флага', keyboardType: 'none', buttons: [], enableBroadcast: false },
  });
  const code = gen(p, 'g02');
  syntax(code, 'g02');
  ok(code.includes('broadcast_nodes = []'), 'broadcast_nodes = [] должен быть при enableBroadcast: false');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: collectBroadcastNodes — сбор узлов из графа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: collectBroadcastNodes ─────────────────────────────────');

test('H01', 'message с enableBroadcast: true → попадает в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_h01', data: { messageText: 'Включён', enableBroadcast: true } }]
  );
  const code = gen(p, 'h01');
  syntax(code, 'h01');
  ok(code.includes('Включён'), 'узел с enableBroadcast: true должен попасть');
  ok(!code.includes('broadcast_nodes = []'), 'broadcast_nodes не должен быть пустым');
});

test('H02', 'message с enableBroadcast: false → НЕ попадает в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_h02', data: { messageText: 'Выключен', enableBroadcast: false } }]
  );
  const code = gen(p, 'h02');
  syntax(code, 'h02');
  ok(code.includes('broadcast_nodes = []'), 'broadcast_nodes должен быть пустым при enableBroadcast: false');
});

test('H03', 'message без enableBroadcast → НЕ попадает в broadcast_nodes', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'broadcast_test',
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: { broadcastApiType: 'bot', idSourceType: 'bot_users', successMessage: '', errorMessage: '' },
  });
  p.sheets[0].nodes.push({
    id: 'msg_h03',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Без флага', keyboardType: 'none', buttons: [] },
  });
  const code = gen(p, 'h03');
  syntax(code, 'h03');
  ok(code.includes('broadcast_nodes = []'), 'broadcast_nodes должен быть пустым без enableBroadcast');
});

test('H04', 'broadcastTargetNode: "broadcast_test" → попадает (совпадает с nodeId)', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_h04', data: { messageText: 'Целевой', enableBroadcast: true, broadcastTargetNode: 'broadcast_test' } }]
  );
  const code = gen(p, 'h04');
  syntax(code, 'h04');
  ok(code.includes('Целевой'), 'узел с совпадающим broadcastTargetNode должен попасть');
});

test('H05', 'broadcastTargetNode: "other_broadcast" → НЕ попадает (не совпадает)', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_h05', data: { messageText: 'Чужой', enableBroadcast: true, broadcastTargetNode: 'other_broadcast' } }]
  );
  const code = gen(p, 'h05');
  syntax(code, 'h05');
  ok(code.includes('broadcast_nodes = []'), 'узел с другим broadcastTargetNode не должен попасть');
});

test('H06', 'broadcastTargetNode: "all" → попадает', () => {
  const p = addBroadcastWithMessages(
    {},
    [{ id: 'msg_h06', data: { messageText: 'Для всех', enableBroadcast: true, broadcastTargetNode: 'all' } }]
  );
  const code = gen(p, 'h06');
  syntax(code, 'h06');
  ok(code.includes('Для всех'), 'узел с broadcastTargetNode: "all" должен попасть');
});

test('H07', 'цепочка autoTransitionTo — target-узел без enableBroadcast разворачивается', () => {
  const p = addBroadcastWithMessages(
    {},
    [
      { id: 'msg_h07a', data: { messageText: 'Начало цепочки', enableBroadcast: true, autoTransitionTo: 'msg_h07b' } },
      { id: 'msg_h07b', data: { messageText: 'Конец цепочки', enableBroadcast: false } },
    ]
  );
  const code = gen(p, 'h07');
  syntax(code, 'h07');
  ok(code.includes('Начало цепочки'), 'начало цепочки должно быть');
  ok(code.includes('Конец цепочки'), 'конец цепочки должен разворачиваться из autoTransitionTo');
});

test('H08', 'несколько message-узлов с enableBroadcast → все попадают', () => {
  const p = addBroadcastWithMessages(
    {},
    [
      { id: 'msg_h08a', data: { messageText: 'Первый', enableBroadcast: true } },
      { id: 'msg_h08b', data: { messageText: 'Второй', enableBroadcast: true } },
      { id: 'msg_h08c', data: { messageText: 'Третий', enableBroadcast: true } },
    ]
  );
  const code = gen(p, 'h08');
  syntax(code, 'h08');
  ok(code.includes('Первый'), 'первый узел должен быть');
  ok(code.includes('Второй'), 'второй узел должен быть');
  ok(code.includes('Третий'), 'третий узел должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Client API — базовые случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Client API — базовые случаи ───────────────────────────');

test('I01', 'broadcastApiType: client → TelegramClient в коде', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_i01', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i01');
  syntax(code, 'i01');
  ok(code.includes('TelegramClient'), 'TelegramClient должен быть в коде');
});

test('I02', 'broadcastApiType: client → StringSession в коде', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_i02', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i02');
  syntax(code, 'i02');
  ok(code.includes('StringSession'), 'StringSession должен быть в коде');
});

test('I03', 'broadcastApiType: client → app.send_message (не bot.send_message)', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_i03', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i03');
  syntax(code, 'i03');
  ok(code.includes('app.send_message'), 'app.send_message должен быть');
});

test('I04', 'broadcastApiType: client + idSourceType: user_ids → SELECT FROM user_ids', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client', idSourceType: 'user_ids' },
    [{ id: 'msg_i04', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i04');
  syntax(code, 'i04');
  ok(code.includes('SELECT DISTINCT user_id FROM user_ids'), 'SELECT FROM user_ids должен быть');
  ok(!code.includes('SELECT DISTINCT user_id FROM bot_users'), 'SELECT FROM bot_users не должен быть');
});

test('I05', 'broadcastApiType: client + idSourceType: both → оба SELECT', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client', idSourceType: 'both' },
    [{ id: 'msg_i05', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i05');
  syntax(code, 'i05');
  ok(code.includes('SELECT DISTINCT user_id FROM user_ids'), 'SELECT FROM user_ids должен быть');
  ok(code.includes('SELECT DISTINCT user_id FROM bot_users'), 'SELECT FROM bot_users должен быть');
});

test('I06', 'broadcastApiType: bot → bot.send_message (не app.send_message)', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'bot' },
    [{ id: 'msg_i06', data: { messageText: 'Bot рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i06');
  syntax(code, 'i06');
  ok(code.includes('bot.send_message'), 'bot.send_message должен быть');
});

test('I07', 'Client API → app.disconnect() в коде (finally блок)', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_i07', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i07');
  syntax(code, 'i07');
  ok(code.includes('app.disconnect()'), 'app.disconnect() должен быть в finally блоке');
});

test('I08', 'Client API → проверка сессии user_telegram_settings', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_i08', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'i08');
  syntax(code, 'i08');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Client API — медиа и autoTransitionTo
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Client API — медиа и autoTransitionTo ─────────────────');

test('J01', 'Client API + imageUrl → app.send_file в коде', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_j01', data: { messageText: 'Фото', enableBroadcast: true, imageUrl: 'https://example.com/photo.jpg' } }]
  );
  const code = gen(p, 'j01');
  syntax(code, 'j01');
  ok(code.includes('app.send_file'), 'app.send_file должен быть для медиа в Client API');
});

test('J02', 'Client API + autoTransitionTo → autoTransitionTo в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_j02', data: { messageText: 'С переходом', enableBroadcast: true, autoTransitionTo: 'next_node' } }]
  );
  const code = gen(p, 'j02');
  syntax(code, 'j02');
  ok(code.includes('"autoTransitionTo": "next_node"'), 'autoTransitionTo должен быть в broadcast_nodes');
});

test('J03', 'Client API + attachedMedia → attachedMedia в broadcast_nodes', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_j03', data: { messageText: 'Медиа', enableBroadcast: true, attachedMedia: ['imageUrlVar'] } }]
  );
  const code = gen(p, 'j03');
  syntax(code, 'j03');
  ok(code.includes('"imageUrlVar"'), '"imageUrlVar" должен быть в broadcast_nodes');
});

test('J04', 'Client API → PEER_ID_INVALID в коде (обработка блокировки)', () => {
  const p = addBroadcastWithMessages(
    { broadcastApiType: 'client' },
    [{ id: 'msg_j04', data: { messageText: 'Client рассылка', enableBroadcast: true } }]
  );
  const code = gen(p, 'j04');
  syntax(code, 'j04');
  ok(code.includes('PEER_ID_INVALID'), 'PEER_ID_INVALID должен быть в коде для обработки блокировки');
});
