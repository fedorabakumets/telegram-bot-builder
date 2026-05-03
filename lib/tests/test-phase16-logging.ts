/**
 * @fileoverview Фаза 16 — Логирование исходящих сообщений бота
 *
 * Блок A: Наличие middleware-функций
 * Блок B: _wrap_bot_send_message
 * Блок C: _wrap_bot_send_photo
 * Блок D: _wrap_message_answer
 * Блок E: save_message_to_api функция
 * Блок F: Регистрация middleware в main()
 * Блок G: Содержимое message_logging_middleware
 * Блок H: Содержимое callback_query_logging_middleware
 * Блок I: Узлы с медиа + DB
 * Блок J: Inline/reply кнопки + DB
 * Блок K: Комбинации
 * Блок L: Граничные случаи
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase16DB_${label}`, userDatabaseEnabled: true, enableComments: false });
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase16_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p16_${label}.py`;
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

// ─── Вспомогательные проекты ─────────────────────────────────────────────────

function makeInlineProject() {
  return makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }] },
  }, {
    id: 'msg1', type: 'message', position: { x: 0, y: 200 },
    data: { messageText: 'Ответ', buttons: [], keyboardType: 'none' },
  }]);
}

function makeReplyProject() {
  return makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'reply',
      buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }] },
  }]);
}

function makeSimpleProject() {
  return makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  }]);
}

/** Создаёт message-узел для сценариев логирования с keyboardNodeId. */
function makeMessageNode(id: string, messageText = 'Ответ', data: Record<string, any> = {}) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 200 },
    data: {
      messageText,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

/** Создаёт отдельную keyboard-ноду для сценариев логирования. */
function makeKeyboardNode(
  id: string,
  keyboardType: 'inline' | 'reply' = 'inline',
  buttons: any[] = [],
  data: Record<string, any> = {},
) {
  return {
    id,
    type: 'keyboard',
    position: { x: 300, y: 200 },
    data: {
      keyboardType,
      buttons,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      ...data,
    },
  };
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 16 — Логирование исходящих сообщений бота            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Наличие middleware-функций
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Наличие middleware-функций ────────────────────────────');

test('A01', 'userDatabaseEnabled: true → ЕСТЬ message_logging_middleware', () => {
  const code = genDB(makeSimpleProject(), 'a01');
  ok(code.includes('message_logging_middleware'), 'message_logging_middleware должен быть в коде');
});

test('A02', 'userDatabaseEnabled: true + inline → ЕСТЬ callback_query_logging_middleware', () => {
  const code = genDB(makeInlineProject(), 'a02');
  ok(code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware должен быть в коде');
});

test('A03', 'userDatabaseEnabled: true без inline → НЕТ callback_query_logging_middleware', () => {
  const code = genDB(makeSimpleProject(), 'a03');
  ok(!code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware НЕ должен быть в коде без inline');
});

test('A04', 'userDatabaseEnabled: false → НЕТ message_logging_middleware', () => {
  const code = gen(makeSimpleProject(), 'a04');
  ok(!code.includes('message_logging_middleware'), 'message_logging_middleware НЕ должен быть без DB');
});

test('A05', 'userDatabaseEnabled: false → НЕТ callback_query_logging_middleware', () => {
  const code = gen(makeInlineProject(), 'a05');
  ok(!code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware НЕ должен быть без DB');
});

test('A06', 'userDatabaseEnabled: true → ЕСТЬ BotOutgoingLoggingMiddleware', () => {
  const code = genDB(makeSimpleProject(), 'a06');
  ok(code.includes('BotOutgoingLoggingMiddleware'), 'BotOutgoingLoggingMiddleware должен быть в коде');
});

test('A07', 'userDatabaseEnabled: false → НЕТ BotOutgoingLoggingMiddleware', () => {
  const code = gen(makeSimpleProject(), 'a07');
  ok(!code.includes('BotOutgoingLoggingMiddleware'), 'BotOutgoingLoggingMiddleware НЕ должен быть без DB');
});

test('A08', 'userDatabaseEnabled: true → ЕСТЬ save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'a08');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен быть в коде');
});

test('A09', 'userDatabaseEnabled: false → save_message_to_api является заглушкой (нет INSERT INTO)', () => {
  const code = gen(makeSimpleProject(), 'a09');
  ok(!code.includes('INSERT INTO bot_messages'), 'INSERT INTO bot_messages НЕ должен быть без DB (только заглушка)');
});

test('A10', 'userDatabaseEnabled: true → синтаксис Python OK', () => {
  const code = genDB(makeSimpleProject(), 'a10');
  syntax(code, 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: _wrap_bot_send_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: _wrap_bot_send_message ────────────────────────────────');

test('B01', 'userDatabaseEnabled: true → ЕСТЬ def _wrap_bot_send_message', () => {
  const code = genDB(makeSimpleProject(), 'b01');
  ok(code.includes('def _wrap_bot_send_message'), 'def _wrap_bot_send_message должен быть в коде');
});

test('B02', 'userDatabaseEnabled: true → ЕСТЬ _wrap_bot_send_message(bot) в main()', () => {
  const code = genDB(makeSimpleProject(), 'b02');
  ok(code.includes('_wrap_bot_send_message(bot)'), '_wrap_bot_send_message(bot) должен быть в main()');
});

test('B03', 'userDatabaseEnabled: false → НЕТ _wrap_bot_send_message', () => {
  const code = gen(makeSimpleProject(), 'b03');
  ok(!code.includes('_wrap_bot_send_message'), '_wrap_bot_send_message НЕ должен быть без DB');
});

test('B04', 'userDatabaseEnabled: true → ЕСТЬ original_send_message', () => {
  const code = genDB(makeSimpleProject(), 'b04');
  ok(code.includes('original_send_message'), 'original_send_message должен быть в коде');
});

test('B05', 'userDatabaseEnabled: true → ЕСТЬ send_message_with_logging', () => {
  const code = genDB(makeSimpleProject(), 'b05');
  ok(code.includes('send_message_with_logging'), 'send_message_with_logging должен быть в коде');
});

test('B06', 'userDatabaseEnabled: true → send_message_with_logging вызывает save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'b06');
  ok(code.includes('send_message_with_logging'), 'send_message_with_logging должен быть');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться');
});

test('B07', 'userDatabaseEnabled: true → синтаксис OK', () => {
  const code = genDB(makeSimpleProject(), 'b07');
  syntax(code, 'b07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: _wrap_bot_send_photo
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: _wrap_bot_send_photo ──────────────────────────────────');

test('C01', 'userDatabaseEnabled: true → ЕСТЬ def _wrap_bot_send_photo', () => {
  const code = genDB(makeSimpleProject(), 'c01');
  ok(code.includes('def _wrap_bot_send_photo'), 'def _wrap_bot_send_photo должен быть в коде');
});

test('C02', 'userDatabaseEnabled: true → ЕСТЬ _wrap_bot_send_photo(bot) в main()', () => {
  const code = genDB(makeSimpleProject(), 'c02');
  ok(code.includes('_wrap_bot_send_photo(bot)'), '_wrap_bot_send_photo(bot) должен быть в main()');
});

test('C03', 'userDatabaseEnabled: false → НЕТ _wrap_bot_send_photo', () => {
  const code = gen(makeSimpleProject(), 'c03');
  ok(!code.includes('_wrap_bot_send_photo'), '_wrap_bot_send_photo НЕ должен быть без DB');
});

test('C04', 'userDatabaseEnabled: true → ЕСТЬ send_photo_with_logging', () => {
  const code = genDB(makeSimpleProject(), 'c04');
  ok(code.includes('send_photo_with_logging'), 'send_photo_with_logging должен быть в коде');
});

test('C05', 'userDatabaseEnabled: true → send_photo_with_logging вызывает save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'c05');
  ok(code.includes('send_photo_with_logging'), 'send_photo_with_logging должен быть');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться');
});

test('C06', 'userDatabaseEnabled: true → ЕСТЬ FSInputFile обработка для /uploads/', () => {
  const code = genDB(makeSimpleProject(), 'c06');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть в коде');
  ok(code.includes('/uploads/'), '/uploads/ должен быть в коде');
});

test('C06a', 'userDatabaseEnabled: true → ЕСТЬ get_upload_file_path для _wrap_bot_send_photo даже без media-нод', () => {
  const code = genDB(makeSimpleProject(), 'c06a');
  ok(code.includes('def get_upload_file_path('), 'get_upload_file_path должен быть в коде при DB-logging');
  ok(code.includes('send_photo_with_logging'), 'send_photo_with_logging должен быть в коде');
});

test('C07', 'userDatabaseEnabled: true → синтаксис OK', () => {
  const code = genDB(makeSimpleProject(), 'c07');
  syntax(code, 'c07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: _wrap_message_answer
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: _wrap_message_answer ──────────────────────────────────');

test('D01', 'userDatabaseEnabled: true → ЕСТЬ def _wrap_message_answer', () => {
  const code = genDB(makeSimpleProject(), 'd01');
  ok(code.includes('def _wrap_message_answer'), 'def _wrap_message_answer должен быть в коде');
});

test('D02', 'userDatabaseEnabled: true → ЕСТЬ _wrap_message_answer(bot) в main()', () => {
  const code = genDB(makeSimpleProject(), 'd02');
  ok(code.includes('_wrap_message_answer(bot)'), '_wrap_message_answer(bot) должен быть в main()');
});

test('D03', 'userDatabaseEnabled: false → НЕТ _wrap_message_answer', () => {
  const code = gen(makeSimpleProject(), 'd03');
  ok(!code.includes('_wrap_message_answer'), '_wrap_message_answer НЕ должен быть без DB');
});

test('D04', 'userDatabaseEnabled: true → ЕСТЬ _patched_answer', () => {
  const code = genDB(makeSimpleProject(), 'd04');
  ok(code.includes('_patched_answer'), '_patched_answer должен быть в коде');
});

test('D05', 'userDatabaseEnabled: true → ЕСТЬ _patched_answer_photo', () => {
  const code = genDB(makeSimpleProject(), 'd05');
  ok(code.includes('_patched_answer_photo'), '_patched_answer_photo должен быть в коде');
});

test('D06', 'userDatabaseEnabled: true → ЕСТЬ _patched_answer_video', () => {
  const code = genDB(makeSimpleProject(), 'd06');
  ok(code.includes('_patched_answer_video'), '_patched_answer_video должен быть в коде');
});

test('D07', 'userDatabaseEnabled: true → ЕСТЬ _patched_answer_audio', () => {
  const code = genDB(makeSimpleProject(), 'd07');
  ok(code.includes('_patched_answer_audio'), '_patched_answer_audio должен быть в коде');
});

test('D08', 'userDatabaseEnabled: true → ЕСТЬ _patched_answer_document', () => {
  const code = genDB(makeSimpleProject(), 'd08');
  ok(code.includes('_patched_answer_document'), '_patched_answer_document должен быть в коде');
});

test('D09', 'userDatabaseEnabled: true → _patched_answer вызывает save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'd09');
  ok(code.includes('_patched_answer'), '_patched_answer должен быть');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться');
});

test('D10', 'userDatabaseEnabled: true → _patched_answer_photo вызывает save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'd10');
  ok(code.includes('_patched_answer_photo'), '_patched_answer_photo должен быть');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться');
});

test('D11', 'userDatabaseEnabled: true → _Message.answer = _patched_answer', () => {
  const code = genDB(makeSimpleProject(), 'd11');
  ok(code.includes('_Message.answer = _patched_answer'), '_Message.answer = _patched_answer должен быть в коде');
});

test('D12', 'userDatabaseEnabled: true → _Message.answer_photo = _patched_answer_photo', () => {
  const code = genDB(makeSimpleProject(), 'd12');
  ok(code.includes('_Message.answer_photo = _patched_answer_photo'), '_Message.answer_photo = _patched_answer_photo должен быть');
});

test('D13', 'userDatabaseEnabled: true → _Message.answer_video = _patched_answer_video', () => {
  const code = genDB(makeSimpleProject(), 'd13');
  ok(code.includes('_Message.answer_video = _patched_answer_video'), '_Message.answer_video = _patched_answer_video должен быть');
});

test('D14', 'userDatabaseEnabled: true → _Message.answer_audio = _patched_answer_audio', () => {
  const code = genDB(makeSimpleProject(), 'd14');
  ok(code.includes('_Message.answer_audio = _patched_answer_audio'), '_Message.answer_audio = _patched_answer_audio должен быть');
});

test('D15', 'userDatabaseEnabled: true → _Message.answer_document = _patched_answer_document', () => {
  const code = genDB(makeSimpleProject(), 'd15');
  ok(code.includes('_Message.answer_document = _patched_answer_document'), '_Message.answer_document = _patched_answer_document должен быть');
});

test('D16', 'userDatabaseEnabled: true → синтаксис Python OK', () => {
  const code = genDB(makeSimpleProject(), 'd16');
  syntax(code, 'd16');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: save_message_to_api функция
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: save_message_to_api функция ───────────────────────────');

test('E01', 'userDatabaseEnabled: true → ЕСТЬ async def save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'e01');
  ok(code.includes('async def save_message_to_api'), 'async def save_message_to_api должен быть в коде');
});

test('E02', 'userDatabaseEnabled: true → ЕСТЬ INSERT INTO bot_messages', () => {
  const code = genDB(makeSimpleProject(), 'e02');
  ok(code.includes('INSERT INTO bot_messages'), 'INSERT INTO bot_messages должен быть в коде');
});

test('E03', 'userDatabaseEnabled: true → ЕСТЬ PROJECT_ID в INSERT', () => {
  const code = genDB(makeSimpleProject(), 'e03');
  ok(code.includes('PROJECT_ID'), 'PROJECT_ID должен быть в коде');
});

test('E04', 'userDatabaseEnabled: true → ЕСТЬ параметр message_type', () => {
  const code = genDB(makeSimpleProject(), 'e04');
  ok(code.includes('message_type'), 'параметр message_type должен быть в коде');
});

test('E05', 'userDatabaseEnabled: true → ЕСТЬ параметр message_text', () => {
  const code = genDB(makeSimpleProject(), 'e05');
  ok(code.includes('message_text'), 'параметр message_text должен быть в коде');
});

test('E06', 'userDatabaseEnabled: true → ЕСТЬ параметр node_id', () => {
  const code = genDB(makeSimpleProject(), 'e06');
  ok(code.includes('node_id'), 'параметр node_id должен быть в коде');
});

test('E07', 'userDatabaseEnabled: true → ЕСТЬ параметр message_data', () => {
  const code = genDB(makeSimpleProject(), 'e07');
  ok(code.includes('message_data'), 'параметр message_data должен быть в коде');
});

test('E08', 'userDatabaseEnabled: true → ЕСТЬ json.dumps', () => {
  const code = genDB(makeSimpleProject(), 'e08');
  ok(code.includes('json.dumps'), 'json.dumps должен быть в коде');
});

test('E09', 'userDatabaseEnabled: true → ЕСТЬ except Exception обработка ошибок', () => {
  const code = genDB(makeSimpleProject(), 'e09');
  ok(code.includes('except Exception'), 'except Exception должен быть в коде');
});

test('E10', 'userDatabaseEnabled: true → ЕСТЬ проверка db_pool', () => {
  const code = genDB(makeSimpleProject(), 'e10');
  ok(code.includes('db_pool'), 'db_pool должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Регистрация middleware в main()
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Регистрация middleware в main() ───────────────────────');

test('F01', 'userDatabaseEnabled: true → ЕСТЬ dp.message.middleware(message_logging_middleware)', () => {
  const code = genDB(makeSimpleProject(), 'f01');
  ok(code.includes('dp.message.middleware(message_logging_middleware)'), 'dp.message.middleware(message_logging_middleware) должен быть');
});

test('F02', 'userDatabaseEnabled: true + inline → ЕСТЬ dp.callback_query.middleware(callback_query_logging_middleware)', () => {
  const code = genDB(makeInlineProject(), 'f02');
  ok(code.includes('dp.callback_query.middleware(callback_query_logging_middleware)'), 'dp.callback_query.middleware должен быть');
});

test('F03', 'userDatabaseEnabled: true без inline → НЕТ dp.callback_query.middleware', () => {
  const code = genDB(makeSimpleProject(), 'f03');
  ok(!code.includes('dp.callback_query.middleware'), 'dp.callback_query.middleware НЕ должен быть без inline');
});

test('F04', 'userDatabaseEnabled: true → ЕСТЬ dp.message.outer_middleware(BotOutgoingLoggingMiddleware())', () => {
  const code = genDB(makeSimpleProject(), 'f04');
  ok(code.includes('dp.message.outer_middleware(BotOutgoingLoggingMiddleware())'), 'dp.message.outer_middleware должен быть');
});

test('F05', 'userDatabaseEnabled: false → НЕТ dp.message.middleware(message_logging_middleware)', () => {
  const code = gen(makeSimpleProject(), 'f05');
  ok(!code.includes('dp.message.middleware(message_logging_middleware)'), 'dp.message.middleware НЕ должен быть без DB');
});

test('F06', 'userDatabaseEnabled: false → НЕТ dp.message.outer_middleware', () => {
  const code = gen(makeSimpleProject(), 'f06');
  ok(!code.includes('dp.message.outer_middleware'), 'dp.message.outer_middleware НЕ должен быть без DB');
});

test('F07', 'userDatabaseEnabled: true → ЕСТЬ все три wrap-вызова в main()', () => {
  const code = genDB(makeSimpleProject(), 'f07');
  ok(code.includes('_wrap_bot_send_message(bot)'), '_wrap_bot_send_message(bot) должен быть');
  ok(code.includes('_wrap_bot_send_photo(bot)'), '_wrap_bot_send_photo(bot) должен быть');
  ok(code.includes('_wrap_message_answer(bot)'), '_wrap_message_answer(bot) должен быть');
});

test('F08', 'userDatabaseEnabled: true → синтаксис main() OK', () => {
  const code = genDB(makeSimpleProject(), 'f08');
  syntax(code, 'f08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Содержимое message_logging_middleware
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Содержимое message_logging_middleware ─────────────────');

test('G01', 'userDatabaseEnabled: true → message_logging_middleware содержит event.from_user.id', () => {
  const code = genDB(makeSimpleProject(), 'g01');
  ok(code.includes('event.from_user.id'), 'event.from_user.id должен быть в коде');
});

test('G02', 'userDatabaseEnabled: true → содержит event.text', () => {
  const code = genDB(makeSimpleProject(), 'g02');
  ok(code.includes('event.text'), 'event.text должен быть в коде');
});

test('G03', 'userDatabaseEnabled: true → содержит event.photo', () => {
  const code = genDB(makeSimpleProject(), 'g03');
  ok(code.includes('event.photo'), 'event.photo должен быть в коде');
});

test('G04', 'userDatabaseEnabled: true → содержит event.caption', () => {
  const code = genDB(makeSimpleProject(), 'g04');
  ok(code.includes('event.caption'), 'event.caption должен быть в коде');
});

test('G05', 'userDatabaseEnabled: true → вызывает save_message_to_api', () => {
  const code = genDB(makeSimpleProject(), 'g05');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться в middleware');
});

test('G06', 'userDatabaseEnabled: true → содержит message_type="user"', () => {
  const code = genDB(makeSimpleProject(), 'g06');
  ok(code.includes('message_type="user"'), 'message_type="user" должен быть в коде');
});

test('G07', 'userDatabaseEnabled: true → содержит event.photo[-1]', () => {
  const code = genDB(makeSimpleProject(), 'g07');
  ok(code.includes('event.photo[-1]'), 'event.photo[-1] должен быть в коде');
});

test('G08', 'userDatabaseEnabled: true → содержит return await handler(event, data)', () => {
  const code = genDB(makeSimpleProject(), 'g08');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Содержимое callback_query_logging_middleware
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Содержимое callback_query_logging_middleware ──────────');

test('H01', 'userDatabaseEnabled: true + inline → содержит event.from_user.id', () => {
  const code = genDB(makeInlineProject(), 'h01');
  ok(code.includes('event.from_user.id'), 'event.from_user.id должен быть в коде');
});

test('H02', 'userDatabaseEnabled: true + inline → содержит event.data', () => {
  const code = genDB(makeInlineProject(), 'h02');
  ok(code.includes('event.data'), 'event.data должен быть в коде');
});

test('H03', 'userDatabaseEnabled: true + inline → содержит button_text', () => {
  const code = genDB(makeInlineProject(), 'h03');
  ok(code.includes('button_text'), 'button_text должен быть в коде');
});

test('H04', 'userDatabaseEnabled: true + inline → содержит inline_keyboard', () => {
  const code = genDB(makeInlineProject(), 'h04');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

test('H05', 'userDatabaseEnabled: true + inline → вызывает save_message_to_api', () => {
  const code = genDB(makeInlineProject(), 'h05');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должен вызываться');
});

test('H06', 'userDatabaseEnabled: true + inline → содержит message_type="user"', () => {
  const code = genDB(makeInlineProject(), 'h06');
  ok(code.includes('message_type="user"'), 'message_type="user" должен быть в коде');
});

test('H07', 'userDatabaseEnabled: true + inline → содержит button_clicked', () => {
  const code = genDB(makeInlineProject(), 'h07');
  ok(code.includes('button_clicked'), 'button_clicked должен быть в коде');
});

test('H08', 'userDatabaseEnabled: true + inline → содержит return await handler(event, data)', () => {
  const code = genDB(makeInlineProject(), 'h08');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Узлы с медиа + DB
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Узлы с медиа + DB ─────────────────────────────────────');

test('I01', 'start + imageUrl + DB → ЕСТЬ answer_photo или send_photo в коде, синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], imageUrl: 'https://example.com/photo.jpg' },
  }]);
  const code = genDB(p, 'i01');
  syntax(code, 'i01');
  ok(code.includes('answer_photo') || code.includes('send_photo'), 'answer_photo или send_photo должен быть в коде');
});

test('I02', 'start + videoUrl + DB → ЕСТЬ answer_video или send_video в коде, синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], videoUrl: 'https://example.com/video.mp4' },
  }]);
  const code = genDB(p, 'i02');
  syntax(code, 'i02');
  ok(code.includes('answer_video') || code.includes('send_video'), 'answer_video или send_video должен быть в коде');
});

test('I03', 'start + audioUrl + DB → ЕСТЬ answer_audio или send_audio в коде, синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], audioUrl: 'https://example.com/audio.mp3' },
  }]);
  const code = genDB(p, 'i03');
  syntax(code, 'i03');
  ok(code.includes('answer_audio') || code.includes('send_audio'), 'answer_audio или send_audio должен быть в коде');
});

test('I04', 'start + documentUrl + DB → ЕСТЬ answer_document или send_document в коде, синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], documentUrl: 'https://example.com/doc.pdf' },
  }]);
  const code = genDB(p, 'i04');
  syntax(code, 'i04');
  ok(code.includes('answer_document') || code.includes('send_document'), 'answer_document или send_document должен быть в коде');
});

test('I05', 'start + imageUrl + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], imageUrl: 'https://example.com/photo.jpg' },
  }]);
  syntax(genDB(p, 'i05'), 'i05');
});

test('I06', 'message + imageUrl + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Фото', buttons: [], keyboardType: 'none', imageUrl: 'https://example.com/photo.jpg' } },
  ]);
  syntax(genDB(p, 'i06'), 'i06');
});

test('I07', 'command + imageUrl + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 200 }, data: { command: '/photo', messageText: 'Фото', buttons: [], keyboardType: 'none', imageUrl: 'https://example.com/photo.jpg' } },
  ]);
  syntax(genDB(p, 'i07'), 'i07');
});

test('I08', 'start + imageUrl + NO DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], imageUrl: 'https://example.com/photo.jpg' },
  }]);
  syntax(gen(p, 'i08'), 'i08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Inline/reply кнопки + DB
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Inline/reply кнопки + DB ─────────────────────────────');

test('J01', 'start + inline-кнопки + DB → ЕСТЬ callback_query_logging_middleware, синтаксис OK', () => {
  const code = genDB(makeInlineProject(), 'j01');
  syntax(code, 'j01');
  ok(code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware должен быть');
});

test('J02', 'start + inline-кнопки + DB → ЕСТЬ InlineKeyboardBuilder', () => {
  const code = genDB(makeInlineProject(), 'j02');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в коде');
});

test('J03', 'start + inline-кнопки + DB → синтаксис OK', () => {
  syntax(genDB(makeInlineProject(), 'j03'), 'j03');
});

test('J04', 'message + inline-кнопки + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Выбери', buttons: [{ id: 'b1', text: 'Да', action: 'goto', target: 'start1' }], keyboardType: 'inline' } },
  ]);
  syntax(genDB(p, 'j04'), 'j04');
});

test('J05', 'command + inline-кнопки + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 200 }, data: { command: '/menu', messageText: 'Меню', buttons: [{ id: 'b1', text: 'Пункт', action: 'goto', target: 'start1' }], keyboardType: 'inline' } },
  ]);
  syntax(genDB(p, 'j05'), 'j05');
});

test('J06', 'start + reply-кнопки + DB → НЕТ callback_query_logging_middleware', () => {
  const code = genDB(makeReplyProject(), 'j06');
  ok(!code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware НЕ должен быть для reply-кнопок');
});

test('J07', 'start + reply-кнопки + DB → синтаксис OK', () => {
  syntax(genDB(makeReplyProject(), 'j07'), 'j07');
});

test('J08', 'start + inline + reply смешанные узлы + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Inline', action: 'goto', target: 'msg1' }] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Reply', buttons: [{ id: 'b2', text: 'Reply', action: 'goto', target: 'start1' }], keyboardType: 'reply' } },
  ]);
  syntax(genDB(p, 'j08'), 'j08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Комбинации ────────────────────────────────────────────');

test('K01', 'start + message + command + DB → все middleware, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 400 }, data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'k01');
  syntax(code, 'k01');
  ok(code.includes('message_logging_middleware'), 'message_logging_middleware должен быть');
  ok(code.includes('BotOutgoingLoggingMiddleware'), 'BotOutgoingLoggingMiddleware должен быть');
});

test('K02', 'start + message + inline + DB → callback_query_logging_middleware есть, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Выбери', buttons: [{ id: 'b1', text: 'Да', action: 'goto', target: 'start1' }], keyboardType: 'inline' } },
  ]);
  const code = genDB(p, 'k02');
  syntax(code, 'k02');
  ok(code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware должен быть');
});

test('K03', 'start + collectUserInput + DB → _wrap_message_answer есть, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'input1', type: 'collectUserInput', position: { x: 0, y: 200 }, data: { messageText: 'Введи имя', variableName: 'user_name', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'k03');
  syntax(code, 'k03');
  ok(code.includes('_wrap_message_answer'), '_wrap_message_answer должен быть');
});

test('K04', 'start + imageUrl + inline + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'start1' }], imageUrl: 'https://example.com/photo.jpg' },
  }]);
  syntax(genDB(p, 'k04'), 'k04');
});

test('K05', 'полный проект + DB → все 3 wrap-функции, синтаксис OK', () => {
  const code = genDB(makeInlineProject(), 'k05');
  syntax(code, 'k05');
  ok(code.includes('_wrap_bot_send_message'), '_wrap_bot_send_message должен быть');
  ok(code.includes('_wrap_bot_send_photo'), '_wrap_bot_send_photo должен быть');
  ok(code.includes('_wrap_message_answer'), '_wrap_message_answer должен быть');
});

test('K06', 'start + message + command + NO DB → ни одного middleware, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 400 }, data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = gen(p, 'k06');
  syntax(code, 'k06');
  ok(!code.includes('message_logging_middleware'), 'message_logging_middleware НЕ должен быть');
  ok(!code.includes('BotOutgoingLoggingMiddleware'), 'BotOutgoingLoggingMiddleware НЕ должен быть');
  ok(!code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware НЕ должен быть');
});

test('K07', 'broadcast + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'bc1', type: 'broadcast', position: { x: 0, y: 200 }, data: { messageText: 'Рассылка', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(genDB(p, 'k07'), 'k07');
});

test('K08', 'multiselect + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    { id: 'ms1', type: 'multiselect', position: { x: 0, y: 200 }, data: { messageText: 'Выбери несколько', variableName: 'choices', options: ['Один', 'Два', 'Три'], buttons: [], keyboardType: 'none' } },
  ]);
  syntax(genDB(p, 'k08'), 'k08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Граничные случаи ──────────────────────────────────────');

test('L01', 'пустой messageText + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: '', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l01'), 'l01');
});

test('L02', 'messageText с кириллицей + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет, мир! Это кириллица.', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l02'), 'l02');
});

test('L03', 'messageText с эмодзи + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: '🎉 Привет! 🚀 Добро пожаловать! 🌟', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l03'), 'l03');
});

test('L04', 'messageText с двойными кавычками + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Он сказал "привет" и ушёл', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l04'), 'l04');
});

test('L05', 'очень длинный messageText (3000 символов) + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'А'.repeat(3000), keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l05'), 'l05');
});

test('L06', 'nodeId с дефисами + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'start-node-with-dashes', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l06'), 'l06');
});

test('L07', 'nodeId начинающийся с цифры + DB → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: '123start', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  }]);
  syntax(genDB(p, 'l07'), 'l07');
});

test('L08', '10 inline-кнопок + DB → синтаксис OK', () => {
  const buttons = Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, text: `Кнопка ${i + 1}`, action: 'goto', target: 'start1' }));
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'inline', buttons },
  }]);
  syntax(genDB(p, 'l08'), 'l08');
});

test('L09', '10 reply-кнопок + DB → синтаксис OK', () => {
  const buttons = Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, text: `Кнопка ${i + 1}`, action: 'goto', target: 'start1' }));
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'reply', buttons },
  }]);
  syntax(genDB(p, 'l09'), 'l09');
});

test('L10', "imageUrl = '/uploads/photo.jpg' (локальный) + DB → синтаксис OK", () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], imageUrl: '/uploads/photo.jpg' },
  }]);
  syntax(genDB(p, 'l10'), 'l10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: register_user_middleware (autoRegisterUsers)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: register_user_middleware ──────────────────────────────');

function genAutoReg(project: unknown, label: string, withDB = false): string {
  return generatePythonCode(project as any, {
    botName: `Phase16AR_${label}`,
    userDatabaseEnabled: withDB,
    autoRegisterUsers: true,
    enableComments: false,
  });
}

test('M01', 'autoRegisterUsers: true → ЕСТЬ register_user_middleware', () => {
  const code = genAutoReg(makeSimpleProject(), 'm01');
  ok(code.includes('register_user_middleware'), 'register_user_middleware должен быть в коде');
});

test('M02', 'autoRegisterUsers: false (по умолчанию) → НЕТ register_user_middleware', () => {
  const code = gen(makeSimpleProject(), 'm02');
  ok(!code.includes('register_user_middleware'), 'register_user_middleware НЕ должен быть без autoRegisterUsers');
});

test('M03', 'autoRegisterUsers: true → register_user_middleware содержит language_code', () => {
  const code = genAutoReg(makeSimpleProject(), 'm03');
  ok(code.includes('language_code'), 'language_code должен быть в register_user_middleware');
});

test('M04', 'autoRegisterUsers: true → register_user_middleware содержит is_premium', () => {
  const code = genAutoReg(makeSimpleProject(), 'm04');
  ok(code.includes('is_premium'), 'is_premium должен быть в register_user_middleware');
});

test('M05', 'autoRegisterUsers: true → register_user_middleware содержит is_bot', () => {
  const code = genAutoReg(makeSimpleProject(), 'm05');
  ok(code.includes('is_bot'), 'is_bot должен быть в register_user_middleware');
});

test('M06', 'autoRegisterUsers: true → регистрируется через dp.message.middleware', () => {
  const code = genAutoReg(makeSimpleProject(), 'm06');
  ok(code.includes('dp.message.middleware(register_user_middleware)'), 'dp.message.middleware(register_user_middleware) должен быть в main()');
});

test('M07', 'autoRegisterUsers: true + userDatabaseEnabled: true → вызывает save_user_to_db', () => {
  const code = genAutoReg(makeSimpleProject(), 'm07', true);
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен вызываться при autoRegisterUsers + DB');
});

test('M08', 'autoRegisterUsers: true + userDatabaseEnabled: false → НЕТ save_user_to_db в middleware', () => {
  const code = genAutoReg(makeSimpleProject(), 'm08', false);
  // save_user_to_db не должен быть в коде вообще (нет БД)
  ok(!code.includes('save_user_to_db'), 'save_user_to_db НЕ должен быть без DB');
});

test('M09', 'autoRegisterUsers: true → содержит user_id not in user_data', () => {
  const code = genAutoReg(makeSimpleProject(), 'm09');
  ok(code.includes('user_id not in user_data'), 'проверка user_id not in user_data должна быть');
});

test('M10', 'autoRegisterUsers: true → синтаксис Python OK', () => {
  const code = genAutoReg(makeSimpleProject(), 'm10');
  syntax(code, 'm10');
});

test('M11', 'autoRegisterUsers: true + userDatabaseEnabled: true → синтаксис Python OK', () => {
  const code = genAutoReg(makeSimpleProject(), 'm11', true);
  syntax(code, 'm11');
});

test('M12', 'autoRegisterUsers: true + inline → синтаксис Python OK', () => {
  const code = genAutoReg(makeInlineProject(), 'm12');
  syntax(code, 'm12');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

test('K09', 'message + отдельная inline keyboard-нода + DB → callback_query_logging_middleware и синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    makeMessageNode('msg1', 'Выбери', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'inline', [
      { id: 'b1', text: 'Да', action: 'goto', target: 'msg2' },
    ]),
    makeMessageNode('msg2', 'Ответ'),
  ]);
  const code = genDB(p, 'k09');
  syntax(code, 'k09');
  ok(code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware должен быть');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть');
});

test('K10', 'message + отдельная reply keyboard-нода + DB → callback_query_logging_middleware не нужен, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    makeMessageNode('msg1', 'Выбери', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'reply', [
      { id: 'b1', text: 'Да', action: 'goto', target: 'msg2' },
      { id: 'b2', text: 'Нет', action: 'goto', target: 'msg2' },
    ]),
    makeMessageNode('msg2', 'Ответ'),
  ]);
  const code = genDB(p, 'k10');
  syntax(code, 'k10');
  ok(!code.includes('callback_query_logging_middleware'), 'callback_query_logging_middleware не должен быть для reply keyboard-ноды');
  ok(code.includes('ReplyKeyboardBuilder'), 'ReplyKeyboardBuilder должен быть');
  ok(code.includes('KeyboardButton'), 'KeyboardButton должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Redis Pub/Sub в save_message_to_api
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Redis Pub/Sub в save_message_to_api ───────────────────');

test('N01', 'userDatabaseEnabled: true → save_message_to_api содержит _redis_client', () => {
  const code = genDB(makeSimpleProject(), 'n01');
  ok(code.includes('_redis_client'), '_redis_client должен быть в коде при DB');
});

test('N02', 'userDatabaseEnabled: true → save_message_to_api содержит redis publish', () => {
  const code = genDB(makeSimpleProject(), 'n02');
  ok(code.includes('_redis_client.publish'), '_redis_client.publish должен быть в save_message_to_api');
});

test('N03', 'userDatabaseEnabled: true → Redis publish использует канал bot:message:', () => {
  const code = genDB(makeSimpleProject(), 'n03');
  ok(code.includes('bot:message:'), 'канал bot:message: должен быть в коде');
});

test('N04', 'userDatabaseEnabled: true → Redis publish payload содержит userId', () => {
  const code = genDB(makeSimpleProject(), 'n04');
  ok(code.includes('"userId"'), 'поле userId должно быть в Redis payload');
});

test('N05', 'userDatabaseEnabled: true → Redis publish payload содержит messageType', () => {
  const code = genDB(makeSimpleProject(), 'n05');
  ok(code.includes('"messageType"'), 'поле messageType должно быть в Redis payload');
});

test('N06', 'userDatabaseEnabled: true → Redis publish payload содержит messageText', () => {
  const code = genDB(makeSimpleProject(), 'n06');
  ok(code.includes('"messageText"'), 'поле messageText должно быть в Redis payload');
});

test('N07', 'userDatabaseEnabled: true → Redis publish payload содержит createdAt', () => {
  const code = genDB(makeSimpleProject(), 'n07');
  ok(code.includes('"createdAt"'), 'поле createdAt должно быть в Redis payload');
});

test('N08', 'userDatabaseEnabled: true → Redis publish обёрнут в try/except (не блокирует БД)', () => {
  const code = genDB(makeSimpleProject(), 'n08');
  // Проверяем что publish внутри try/except
  const publishIdx = code.indexOf('_redis_client.publish');
  const tryBeforePublish = code.lastIndexOf('try:', publishIdx);
  const exceptAfterPublish = code.indexOf('except Exception as _re', publishIdx);
  ok(publishIdx !== -1, '_redis_client.publish должен быть в коде');
  ok(tryBeforePublish !== -1 && tryBeforePublish < publishIdx, 'try: должен быть перед publish');
  ok(exceptAfterPublish !== -1, 'except Exception as _re должен быть после publish');
});

test('N09', 'userDatabaseEnabled: true → Redis publish происходит ПОСЛЕ INSERT (после result)', () => {
  const code = genDB(makeSimpleProject(), 'n09');
  const insertIdx = code.indexOf('INSERT INTO bot_messages');
  const publishIdx = code.indexOf('_redis_client.publish');
  ok(insertIdx !== -1, 'INSERT INTO bot_messages должен быть в коде');
  ok(publishIdx !== -1, '_redis_client.publish должен быть в коде');
  ok(publishIdx > insertIdx, 'Redis publish должен быть ПОСЛЕ INSERT');
});

test('N10', 'userDatabaseEnabled: true → синтаксис Python OK с Redis publish', () => {
  const code = genDB(makeSimpleProject(), 'n10');
  syntax(code, 'n10');
});

test('N11', 'userDatabaseEnabled: false → НЕТ _redis_client.publish в save_message_to_api', () => {
  const code = gen(makeSimpleProject(), 'n11');
  ok(!code.includes('_redis_client.publish'), '_redis_client.publish НЕ должен быть без DB');
});

test('N12', 'userDatabaseEnabled: true + inline → Redis publish есть, синтаксис OK', () => {
  const code = genDB(makeInlineProject(), 'n12');
  ok(code.includes('_redis_client.publish'), '_redis_client.publish должен быть');
  syntax(code, 'n12');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total  = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
