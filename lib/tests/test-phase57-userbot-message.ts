/**
 * @fileoverview Интеграционные тесты для узла userbot_message (фаза 57)
 *
 * Блок A: Базовая генерация
 * Блок B: Текст и форматирование
 * Блок C: Entity получатель
 * Блок D: Медиа
 * Блок E: Автопереход и saveMessageIdTo
 * Блок F: Сценарий "юзербот → бот → пользователь"
 * Блок G: FloodWait и ошибки
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase57_${label}`, userDatabaseEnabled: true, enableComments: false, projectId: 1 });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p57_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try { execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' }); fs.unlinkSync(tmp); return { ok: true }; }
  catch (e: any) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, error: e.stderr?.toString() ?? String(e) }; }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

function test(id: string, name: string, fn: () => void) {
  try { fn(); results.push({ id, name, passed: true, note: 'OK' }); console.log(`  ✅ ${id}. ${name}`); }
  catch (e: any) { results.push({ id, name, passed: false, note: e.message }); console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`); }
}

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) { const r = checkSyntax(code, label); ok(r.ok, `Синтаксическая ошибка:\n${r.error}`); }

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/** Создаёт узел userbot_message */
function makeUserbotMessageNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_message' as any, position: { x: 0, y: 0 },
    data: {
      messageText: opts.messageText || 'Тест',
      formatMode: opts.formatMode || 'html',
      userbotEntity: opts.userbotEntity || '@test',
      attachedMedia: opts.attachedMedia || [],
      disableLinkPreview: opts.disableLinkPreview || false,
      saveMessageIdTo: opts.saveMessageIdTo || '',
      autoTransitionTo: opts.autoTransitionTo || '',
      enableAutoTransition: !!opts.autoTransitionTo,
    },
  };
}

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт command_trigger узел */
function makeCommandTrigger(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true, description: '', showInMenu: true, adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
}

/** Создаёт incoming_message_trigger узел */
function makeIncomingMessageTrigger(id: string, target: string) {
  return { id, type: 'incoming_message_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: target, enableAutoTransition: true } };
}

/** Создаёт set_variable узел */
function makeSetVariableNode(id: string, assignments: any[], autoTransitionTo = '') {
  return { id, type: 'set_variable', position: { x: 0, y: 0 }, data: { assignments, autoTransitionTo, enableAutoTransition: !!autoTransitionTo } };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 57 — Узел userbot_message                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'userbot_message → генерируется handle_callback_', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_ub1'), 'handle_callback_ub1 должен быть в коде');
});

test('A02', 'содержит userbot_client.send_message', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a02');
  ok(code.includes('userbot_client.send_message'), 'userbot_client.send_message должен быть в коде');
});

test('A03', 'содержит replace_variables_in_text', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a03');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
});

test('A04', 'содержит @dp.callback_query с nodeId', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a04');
  ok(code.includes('"ub1"'), 'callback_query с "ub1" должен быть в коде');
});

test('A05', 'содержит logging.info с "Userbot"', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a05');
  ok(code.includes('logging.info') && code.includes('Userbot'), 'logging.info с "Userbot" должен быть в коде');
});

test('A06', 'синтаксис Python OK (базовый userbot_message)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1'),
  ]);
  syntax(gen(p, 'a06'), 'a06');
});

test('A07', 'содержит импорт Telethon (from telethon import TelegramClient)', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a07');
  ok(code.includes('from telethon') || code.includes('TelegramClient'), 'Импорт Telethon должен быть в коде');
});

test('A08', 'содержит инициализацию userbot_client (StringSession)', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'a08');
  ok(code.includes('StringSession'), 'StringSession должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Текст и форматирование
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Текст и форматирование ────────────────────────────────');

test('B01', 'formatMode=html → _parse_mode = \'html\'', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { formatMode: 'html' })]);
  const code = gen(p, 'b01');
  ok(code.includes("_parse_mode = 'html'"), "_parse_mode = 'html' должен быть в коде");
});

test('B02', 'formatMode=markdown → _parse_mode = \'md\'', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { formatMode: 'markdown' })]);
  const code = gen(p, 'b02');
  ok(code.includes("_parse_mode = 'md'"), "_parse_mode = 'md' должен быть в коде");
});

test('B03', 'formatMode=none → _parse_mode = None', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { formatMode: 'none' })]);
  const code = gen(p, 'b03');
  ok(code.includes('_parse_mode = None'), '_parse_mode = None должен быть в коде');
});

test('B04', 'disableLinkPreview=true → link_preview=False', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { disableLinkPreview: true })]);
  const code = gen(p, 'b04');
  ok(code.includes('link_preview=False'), 'link_preview=False должен быть в коде');
});

test('B05', 'get_content используется при projectId', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { messageText: 'Привет мир' })]);
  const code = gen(p, 'b05');
  ok(code.includes('get_content'), 'get_content должен быть в коде при projectId');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Entity получатель
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Entity получатель ─────────────────────────────────────');

test('C01', 'userbotEntity="@channel" → содержит @channel в коде', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { userbotEntity: '@channel' })]);
  const code = gen(p, 'c01');
  ok(code.includes('@channel'), '@channel должен быть в коде');
});

test('C02', 'userbotEntity="{chat_id}" → содержит replace_variables_in_text для entity', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { userbotEntity: '{chat_id}' })]);
  const code = gen(p, 'c02');
  ok(code.includes('{chat_id}'), '{chat_id} должен быть в коде');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть для entity');
});

test('C03', 'userbotEntity="me" → содержит "me"', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { userbotEntity: 'me' })]);
  const code = gen(p, 'c03');
  ok(code.includes('me'), '"me" должен быть в коде');
});

test('C04', 'userbotEntity="-1001234" → содержит -1001234', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { userbotEntity: '-1001234' })]);
  const code = gen(p, 'c04');
  ok(code.includes('-1001234'), '-1001234 должен быть в коде');
});

test('C05', 'get_content для entity при projectId', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { userbotEntity: '@target_channel' })]);
  const code = gen(p, 'c05');
  ok(code.includes('get_content') && code.includes('.entity'), 'get_content для entity должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Медиа ─────────────────────────────────────────────────');

test('D01', 'attachedMedia с /uploads/ → содержит send_file и get_upload_file_path', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { attachedMedia: ['/uploads/photo.jpg'] })]);
  const code = gen(p, 'd01');
  ok(code.includes('send_file'), 'send_file должен быть в коде');
  ok(code.includes('get_upload_file_path'), 'get_upload_file_path должен быть в коде');
});

test('D02', 'attachedMedia с URL → содержит send_file и https://', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { attachedMedia: ['https://example.com/video.mp4'] })]);
  const code = gen(p, 'd02');
  ok(code.includes('send_file'), 'send_file должен быть в коде');
  ok(code.includes('https://example.com/video.mp4'), 'URL должен быть в коде');
});

test('D03', 'attachedMedia с несколькими файлами → содержит _album_files', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { attachedMedia: ['/uploads/a.jpg', '/uploads/b.jpg'] })]);
  const code = gen(p, 'd03');
  ok(code.includes('_album_files'), '_album_files должен быть в коде');
});

test('D04', 'без attachedMedia → содержит send_message (не send_file)', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { attachedMedia: [] })]);
  const code = gen(p, 'd04');
  ok(code.includes('send_message'), 'send_message должен быть в коде');
  // send_file не должен быть в блоке обработчика ub1
  const handlerIdx = code.indexOf('handle_callback_ub1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  ok(!handlerBlock.includes('send_file'), 'send_file НЕ должен быть в коде без медиа');
});

test('D05', 'синтаксис OK (с медиа)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1', { attachedMedia: ['/uploads/photo.jpg'] }),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход и saveMessageIdTo
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Автопереход и saveMessageIdTo ─────────────────────────');

test('E01', 'autoTransitionTo → содержит handle_callback_ целевого узла', () => {
  const p = makeCleanProject([
    makeUserbotMessageNode('ub1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e01');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('E02', 'autoTransitionTo → содержит FakeCallbackQuery', () => {
  const p = makeCleanProject([
    makeUserbotMessageNode('ub1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e02');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в коде');
});

test('E03', 'saveMessageIdTo → содержит set_user_var', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1', { saveMessageIdTo: 'last_msg_id' })]);
  const code = gen(p, 'e03');
  ok(code.includes('set_user_var'), 'set_user_var должен быть в коде');
});

test('E04', 'синтаксис OK (с автопереходом)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1', { autoTransitionTo: 'msg1', saveMessageIdTo: 'ub_msg_id' }),
    makeMessageNode('msg1', 'Получено!'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Сценарий "юзербот → бот → пользователь"
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Сценарий "юзербот → бот → пользователь" ──────────────');

test('F01', 'полный сценарий генерируется без ошибок (синтаксис OK)', () => {
  // /start → userbot_message (отправляет видео боту) → incoming_message_trigger → set_variable → message (пользователю)
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1', {
      messageText: 'Видео для бота',
      userbotEntity: '@my_bot',
      attachedMedia: ['/uploads/video.mp4'],
      autoTransitionTo: '',
    }),
    makeIncomingMessageTrigger('imt1', 'sv1'),
    makeSetVariableNode('sv1', [{ id: 'a1', variable: 'file_id', value: '{incoming_file_id}', mode: 'text' }], 'msg1'),
    makeMessageNode('msg1', 'Ваш файл: {file_id}'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'userbot_message содержит send_file к боту', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1', {
      userbotEntity: '@my_bot',
      attachedMedia: ['/uploads/video.mp4'],
    }),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('send_file'), 'send_file должен быть в коде');
  ok(code.includes('@my_bot'), '@my_bot должен быть в коде');
});

test('F03', 'incoming_message_trigger middleware генерируется', () => {
  const p = makeCleanProject([
    makeUserbotMessageNode('ub1', { userbotEntity: '@my_bot' }),
    makeIncomingMessageTrigger('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f03');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger_imt1_middleware должен быть в коде');
});

test('F04', 'message содержит handle_callback_ для отправки пользователю', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ub1'),
    makeUserbotMessageNode('ub1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Результат для пользователя'),
  ]);
  const code = gen(p, 'f04');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('F05', 'несколько userbot_message нод → все генерируются', () => {
  const p = makeCleanProject([
    makeUserbotMessageNode('ub1', { userbotEntity: '@channel1', messageText: 'Первое' }),
    makeUserbotMessageNode('ub2', { userbotEntity: '@channel2', messageText: 'Второе' }),
    makeUserbotMessageNode('ub3', { userbotEntity: '@channel3', messageText: 'Третье' }),
  ]);
  const code = gen(p, 'f05');
  ok(code.includes('handle_callback_ub1'), 'handle_callback_ub1 должен быть в коде');
  ok(code.includes('handle_callback_ub2'), 'handle_callback_ub2 должен быть в коде');
  ok(code.includes('handle_callback_ub3'), 'handle_callback_ub3 должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: FloodWait и ошибки
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: FloodWait и ошибки ────────────────────────────────────');

test('G01', 'содержит FloodWaitError обработку', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'g01');
  ok(code.includes('FloodWait'), 'FloodWait обработка должна быть в коде');
});

test('G02', 'содержит asyncio.sleep для retry', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'g02');
  ok(code.includes('asyncio.sleep'), 'asyncio.sleep должен быть в коде для retry');
});

test('G03', 'содержит logging.error', () => {
  const p = makeCleanProject([makeUserbotMessageNode('ub1')]);
  const code = gen(p, 'g03');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// Итоги
// ════════════════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════════════');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n📊 Итого: ${passed} ✅ / ${failed} ❌ из ${results.length} тестов`);

if (failed > 0) {
  console.log('\n❌ Провалены:');
  results.filter(r => !r.passed).forEach(r => console.log(`   ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}

console.log('\n✅ Все тесты фазы 57 (userbot_message) пройдены!\n');
