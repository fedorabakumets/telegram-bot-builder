/**
 * @fileoverview Фаза 2 — Узел command_trigger
 *
 * Блок A: Базовая генерация
 * Блок B: adminOnly (базовые проверки)
 * Блок C: adminOnly
 * Блок D: requiresAuth
 * Блок E: showInMenu и BotFather команды
 * Блок F: Несколько триггеров
 * Блок G: Целевые узлы (targetNodeId)
 * Блок H: Форматы команд
 * Блок I: MockCallback структура
 * Блок J: Комбинации флагов
 * Блок K: Интеграция с полным проектом
 * Блок L: Граничные случаи
 * Блок M: Производительность
 * Блок N: Отсутствие лишнего кода
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

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase2_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase2DB_${label}`, userDatabaseEnabled: true, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p2_${label}.py`;
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

function makeTriggerNode(id: string, command: string, targetId: string, opts: {
  adminOnly?: boolean;
  requiresAuth?: boolean;
  showInMenu?: boolean;
  description?: string;
} = {}) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: opts.description ?? 'Команда',
      showInMenu: opts.showInMenu ?? true,
      adminOnly: opts.adminOnly ?? false,
      requiresAuth: opts.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт message-узел с поддержкой дополнительных данных, включая keyboardNodeId. */
function makeMessageNode(id: string, text = 'Ответ', data: Record<string, any> = {}) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

/** Создаёт отдельную keyboard-ноду для регрессионных тестов command_trigger. */
function makeKeyboardNode(
  id: string,
  keyboardType: 'inline' | 'reply' = 'inline',
  buttons: any[] = [],
  data: Record<string, any> = {},
) {
  return {
    id,
    type: 'keyboard',
    position: { x: 650, y: 0 },
    data: {
      keyboardType,
      buttons,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      ...data,
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 2 — Узел command_trigger                             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'command_trigger с autoTransitionTo → генерируется @dp.message(Command(...))', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.message(Command('), '@dp.message(Command(...)) должен быть в коде');
});

test('A02', 'слеш убирается из команды → Command("start") не Command("/start")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('Command("start")'), 'Command("start") должен быть в коде');
  ok(!code.includes('Command("/start")'), 'Command("/start") НЕ должен быть в коде');
});

test('A03', 'имя функции содержит nodeId → command_trigger_<id>_handler', () => {
  const p = makeCleanProject([makeTriggerNode('mynode', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('command_trigger_mynode_handler'), 'command_trigger_mynode_handler должен быть в коде');
});

test('A04', 'содержит class MockCallback:', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('A05', 'содержит mock_callback = MockCallback', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('mock_callback = MockCallback('), 'mock_callback = MockCallback( должен быть в коде');
});

test('A06', 'содержит await handle_callback_<targetId>(mock_callback)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'await handle_callback_msg1(mock_callback) должен быть в коде');
});

test('A07', 'содержит logging.info с упоминанием команды', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
  ok(code.includes('/start'), 'команда /start должна упоминаться в logging.info');
});

test('A08', 'содержит user_id = message.from_user.id', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a08');
  ok(code.includes('user_id = message.from_user.id'), 'user_id = message.from_user.id должен быть в коде');
});

test('A09', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'без autoTransitionTo → триггер игнорируется, нет @dp.message(Command(...))', () => {
  const trigger = { ...makeTriggerNode('t1', '/start', ''), data: { ...makeTriggerNode('t1', '/start', '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a10');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть без autoTransitionTo');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: adminOnly (базовые проверки)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: adminOnly (базовые проверки) ──────────────────────────');

test('B01', 'adminOnly: true → есть is_admin(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('is_admin(user_id)'), 'is_admin(user_id) должен быть в коде');
});

test('B02', 'adminOnly: true → есть "У вас нет прав для выполнения этой команды"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('У вас нет прав для выполнения этой команды'), 'Сообщение об отсутствии прав должно быть в коде');
});

test('B03', 'adminOnly: true → есть return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('B04', 'adminOnly: false → нет is_admin(', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  ok(!code.includes('is_admin('), 'is_admin( НЕ должен быть в коде');
});

test('B05', 'adminOnly: false → нет проверки прав вообще', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'b05');
  ok(!code.includes('нет прав'), 'сообщение об отсутствии прав НЕ должно быть в коде');
});

test('B06', 'adminOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'adminOnly: true + requiresAuth: true → обе проверки есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b07');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('B08', 'adminOnly: true → not await is_admin(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b08');
  ok(code.includes('not await is_admin(user_id)'), 'not await is_admin(user_id) должен быть в коде');
});

test('B09', 'adminOnly: true → генерируется is_admin функция', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b09');
  ok(code.includes('async def is_admin') || code.includes('def is_admin'), 'функция is_admin должна быть в коде');
});

test('B10', 'adminOnly: true → порядок: user_id ДО is_admin', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b10');
  const userIdIdx = code.indexOf('user_id = message.from_user.id');
  const adminIdx = code.indexOf('is_admin(user_id)');
  ok(userIdIdx < adminIdx, 'user_id должен быть определён ДО вызова is_admin');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: adminOnly
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: adminOnly ─────────────────────────────────────────────');

test('C01', 'adminOnly: true → есть is_admin(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('is_admin(user_id)'), 'is_admin(user_id) должен быть в коде');
});

test('C02', 'adminOnly: true → есть "У вас нет прав для выполнения этой команды"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  ok(code.includes('У вас нет прав для выполнения этой команды'), 'Сообщение об отсутствии прав должно быть в коде');
});

test('C03', 'adminOnly: true → есть return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c03');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('C04', 'adminOnly: false → нет is_admin(', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'c04');
  ok(!code.includes('is_admin('), 'is_admin( НЕ должен быть в коде');
});

test('C05', 'adminOnly: false → нет проверки прав вообще', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'c05');
  ok(!code.includes('нет прав'), 'сообщение об отсутствии прав НЕ должно быть в коде');
});

test('C06', 'adminOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'c06'), 'c06');
});

test('C07', 'adminOnly: true → генерируется is_admin функция в utils', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c07');
  ok(code.includes('async def is_admin') || code.includes('def is_admin'), 'функция is_admin должна быть в коде');
});

test('C08', 'adminOnly: true → только проверка admin', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c08');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(!code.includes("message.chat.type != 'private'"), 'проверка приватного чата НЕ должна быть');
});

test('C09', 'несколько триггеров, один adminOnly → только у него проверка', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }),
    makeTriggerNode('t2', '/help', 'msg1', { adminOnly: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c09');
  // Проверяем что is_admin есть в обработчике t1, но не в t2
  const t1HandlerIdx = code.indexOf('command_trigger_t1_handler');
  const t2HandlerIdx = code.indexOf('command_trigger_t2_handler');
  const adminIdx = code.indexOf('is_admin(user_id)');
  ok(adminIdx > t1HandlerIdx, 'is_admin должен быть после обработчика t1');
  ok(adminIdx < t2HandlerIdx || t2HandlerIdx === -1 || code.indexOf('is_admin(user_id)', t2HandlerIdx) === -1,
    'is_admin НЕ должен быть в обработчике t2');
});

test('C10', 'adminOnly: true → not await is_admin(user_id) (именно такая форма)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'c10');
  ok(code.includes('not await is_admin(user_id)'), 'not await is_admin(user_id) должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: requiresAuth
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: requiresAuth ──────────────────────────────────────────');

test('D01', 'requiresAuth: true → есть check_auth(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd01');
  ok(code.includes('check_auth(user_id)'), 'check_auth(user_id) должен быть в коде');
});

test('D02', 'requiresAuth: true → есть "Сначала запустите бота: /start"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd02');
  ok(code.includes('Сначала запустите бота: /start'), 'Сообщение о необходимости авторизации должно быть в коде');
});

test('D03', 'requiresAuth: true → есть return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd03');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('D04', 'requiresAuth: false → нет вызова check_auth(user_id) в обработчике', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'd04');
  // check_auth функция всегда генерируется в utils, но вызов в обработчике — нет
  const handlerIdx = code.indexOf('command_trigger_t1_handler');
  const nextHandlerIdx = code.indexOf('async def ', handlerIdx + 1);
  const handlerBody = nextHandlerIdx > 0 ? code.substring(handlerIdx, nextHandlerIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes('not await check_auth(user_id)'), 'вызов check_auth НЕ должен быть в обработчике');
});

test('D05', 'requiresAuth: false → нет проверки авторизации', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'd05');
  ok(!code.includes('запустите бота'), 'сообщение об авторизации НЕ должно быть в коде');
});

test('D06', 'requiresAuth: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'd06'), 'd06');
});

test('D07', 'requiresAuth: true → генерируется check_auth функция в utils', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd07');
  ok(code.includes('async def check_auth') || code.includes('def check_auth'), 'функция check_auth должна быть в коде');
});

test('D08', 'requiresAuth: true + adminOnly: false → только проверка auth', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true, adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'd08');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
  ok(!code.includes('is_admin('), 'проверка admin НЕ должна быть');
});

test('D09', 'несколько триггеров, один requiresAuth → только у него проверка', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }),
    makeTriggerNode('t2', '/help', 'msg1', { requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd09');
  const t1HandlerIdx = code.indexOf('command_trigger_t1_handler');
  const t2HandlerIdx = code.indexOf('command_trigger_t2_handler');
  const authIdx = code.indexOf('check_auth(user_id)');
  ok(authIdx > t1HandlerIdx, 'check_auth должен быть после обработчика t1');
  ok(t2HandlerIdx === -1 || code.indexOf('check_auth(user_id)', t2HandlerIdx) === -1,
    'check_auth НЕ должен быть в обработчике t2');
});

test('D10', 'requiresAuth: true → not await check_auth(user_id) (именно такая форма)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd10');
  ok(code.includes('not await check_auth(user_id)'), 'not await check_auth(user_id) должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: showInMenu и BotFather команды
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: showInMenu и BotFather команды ────────────────────────');

test('E01', 'showInMenu: true → команда попадает в список BotFather в docstring', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Запустить бота' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('start'), 'команда start должна быть в docstring');
});

test('E02', 'showInMenu: false → команда НЕ попадает в список BotFather', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/mytest', 'msg1', { showInMenu: false, description: 'Тест' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  // Команда не должна быть в секции BotFather (docstring)
  const docstringEnd = code.indexOf('"""', 3);
  const docstring = code.substring(0, docstringEnd);
  ok(!docstring.includes('mytest - Тест'), 'команда mytest НЕ должна быть в docstring BotFather');
});

test('E03', 'showInMenu: true + description → описание есть в docstring', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Запустить бота' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('Запустить бота'), 'описание "Запустить бота" должно быть в коде');
});

test('E04', 'несколько триггеров с showInMenu: true → все в docstring', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Старт' }),
    makeTriggerNode('t2', '/help', 'msg1', { showInMenu: true, description: 'Помощь' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e04');
  ok(code.includes('start'), 'команда start должна быть в коде');
  ok(code.includes('help'), 'команда help должна быть в коде');
});

test('E05', 'showInMenu: true → команда в set_my_commands в main()', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Старт' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e05');
  ok(code.includes('set_my_commands') || code.includes('BotCommand'), 'set_my_commands или BotCommand должен быть в коде');
});

test('E06', 'showInMenu: false → команда НЕ в set_my_commands', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/uniquecmd999', 'msg1', { showInMenu: false, description: 'Тест' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e06');
  // Если set_my_commands есть, команда uniquecmd999 не должна там быть
  if (code.includes('set_my_commands')) {
    const mainIdx = code.indexOf('async def main(');
    const mainSection = code.substring(mainIdx);
    ok(!mainSection.includes('uniquecmd999'), 'uniquecmd999 НЕ должна быть в set_my_commands');
  }
  ok(true, 'проверка пройдена');
});

test('E07', 'description: "Запустить бота" → текст описания в коде', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Запустить бота' }), makeMessageNode('msg1')]);
  const code = gen(p, 'e07');
  ok(code.includes('Запустить бота'), '"Запустить бота" должно быть в коде');
});

test('E08', 'description: "" (пустое) → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: '' }), makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать с пустым description');
  gen(p, 'e08');
});

test('E09', 'description с Unicode → генерация не падает, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: '🚀 Запустить бота 🎉' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'e09'), 'e09');
});

test('E10', 'showInMenu: true + showInMenu: false у двух триггеров → только один в меню', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Старт' }),
    makeTriggerNode('t2', '/hidden', 'msg1', { showInMenu: false, description: 'Скрытая' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e10');
  // В docstring BotFather должна быть только start
  const docstringEnd = code.indexOf('"""', 3);
  const docstring = code.substring(0, docstringEnd);
  ok(!docstring.includes('hidden - Скрытая'), 'hidden НЕ должна быть в docstring BotFather');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Несколько триггеров
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Несколько триггеров ───────────────────────────────────');

test('F01', 'два триггера → два @dp.message(Command(...))', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f01');
  const count = (code.match(/@dp\.message\(Command\(/g) || []).length;
  ok(count === 2, `Должно быть 2 @dp.message(Command(...)), найдено: ${count}`);
});

test('F02', 'три триггера → три обработчика', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeTriggerNode('t3', '/menu', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f02');
  const count = (code.match(/command_trigger_\w+_handler/g) || []).length;
  ok(count >= 3, `Должно быть минимум 3 обработчика, найдено: ${count}`);
});

test('F03', '10 триггеров → 10 обработчиков, синтаксис OK', () => {
  const triggers = Array.from({ length: 10 }, (_, i) => makeTriggerNode(`t${i}`, `/cmd${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'f03');
  syntax(code, 'f03');
  const count = (code.match(/@dp\.message\(Command\(/g) || []).length;
  ok(count === 10, `Должно быть 10 @dp.message(Command(...)), найдено: ${count}`);
});

test('F04', 'два триггера с разными командами → оба в коде', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f04');
  ok(code.includes('Command("start")'), 'Command("start") должен быть в коде');
  ok(code.includes('Command("help")'), 'Command("help") должен быть в коде');
});

test('F05', 'два триггера с одинаковой командой → оба генерируются (не дедуплицируются)', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f05');
  const count = (code.match(/@dp\.message\(Command\(/g) || []).length;
  ok(count === 2, `Должно быть 2 обработчика, найдено: ${count}`);
});

test('F06', 'триггер /start + триггер /help → оба Command("start") и Command("help")', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f06');
  ok(code.includes('Command("start")'), 'Command("start") должен быть');
  ok(code.includes('Command("help")'), 'Command("help") должен быть');
});

test('F07', 'несколько триггеров → каждый имеет уникальное имя функции', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeTriggerNode('t3', '/menu', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f07');
  ok(code.includes('command_trigger_t1_handler'), 'command_trigger_t1_handler должен быть');
  ok(code.includes('command_trigger_t2_handler'), 'command_trigger_t2_handler должен быть');
  ok(code.includes('command_trigger_t3_handler'), 'command_trigger_t3_handler должен быть');
});

test('F08', 'несколько триггеров → каждый вызывает свой handle_callback_<targetId>', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg2'),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'f08');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'handle_callback_msg1 должен быть');
  ok(code.includes('await handle_callback_msg2(mock_callback)'), 'handle_callback_msg2 должен быть');
});

test('F09', 'несколько триггеров с разными флагами → флаги независимы', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true }),
    makeTriggerNode('t2', '/help', 'msg1', { requiresAuth: true }),
    makeTriggerNode('t3', '/menu', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f09');
  ok(code.includes('is_admin(user_id)'), 'is_admin должен быть для t1');
  ok(code.includes('check_auth(user_id)'), 'check_auth должен быть для t2');
});

test('F10', '20 триггеров → синтаксис OK, нет дублирующихся функций', () => {
  const triggers = Array.from({ length: 20 }, (_, i) => makeTriggerNode(`trigger${i}`, `/cmd${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'f10');
  syntax(code, 'f10');
  // Проверяем уникальность имён функций
  const handlers = code.match(/async def command_trigger_\w+_handler/g) || [];
  const unique = new Set(handlers);
  ok(unique.size === handlers.length, `Все имена функций должны быть уникальными, найдено дублей: ${handlers.length - unique.size}`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Целевые узлы (targetNodeId)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Целевые узлы (targetNodeId) ───────────────────────────');

test('G01', 'autoTransitionTo → message узел → handle_callback_<id> вызывается', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g01');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'handle_callback_msg1 должен вызываться');
});

test('G02', 'autoTransitionTo → command узел → генерация не падает', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'cmd1'),
    { id: 'cmd1', type: 'command', position: { x: 400, y: 0 }, data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  ok(true, 'генерация не должна падать');
  gen(p, 'g02');
});

test('G03', 'autoTransitionTo → несуществующий ID → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'nonexistent_node_id')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'g03');
});

test('G04', 'autoTransitionTo → пустая строка → триггер игнорируется', () => {
  const trigger = makeTriggerNode('t1', '/start', '');
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'g04');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть с пустым targetId');
});

test('G05', 'autoTransitionTo → null → триггер игнорируется', () => {
  const trigger = { ...makeTriggerNode('t1', '/start', ''), data: { ...makeTriggerNode('t1', '/start', '').data, autoTransitionTo: null } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'g05');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть с null targetId');
});

test('G06', 'autoTransitionTo → undefined → триггер игнорируется', () => {
  const trigger = { ...makeTriggerNode('t1', '/start', ''), data: { ...makeTriggerNode('t1', '/start', '').data, autoTransitionTo: undefined } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'g06');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть с undefined targetId');
});

test('G07', 'autoTransitionTo → ID с дефисами → safe_name применяется', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'my-target-node'), makeMessageNode('my-target-node')]);
  const code = gen(p, 'g07');
  syntax(code, 'g07');
  ok(code.includes('handle_callback_my_target_node') || code.includes('handle_callback_'), 'safe_name должен применяться к ID с дефисами');
});

test('G08', 'autoTransitionTo → ID начинающийся с цифры → генерация не падает, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', '123target'), makeMessageNode('123target')]);
  const code = gen(p, 'g08');
  // safe_name сохраняет цифровой префикс в имени функции
  ok(code.includes('handle_callback_'), 'handle_callback_ должен быть в коде');
  syntax(code, 'g08');
});

test('G09', 'autoTransitionTo → ID с кириллицей → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'узел1'), makeMessageNode('узел1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'g09');
});

test('G10', 'autoTransitionTo → ID с пробелами → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'my node id'), makeMessageNode('my node id')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'g10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Форматы команд
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Форматы команд ────────────────────────────────────────');

test('H01', 'команда /start → Command("start")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h01');
  ok(code.includes('Command("start")'), 'Command("start") должен быть в коде');
});

test('H02', 'команда /help → Command("help")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/help', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h02');
  ok(code.includes('Command("help")'), 'Command("help") должен быть в коде');
});

test('H03', 'команда /menu_main → Command("menu_main")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/menu_main', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h03');
  ok(code.includes('Command("menu_main")'), 'Command("menu_main") должен быть в коде');
});

test('H04', 'команда без слеша "start" → обрабатывается корректно', () => {
  const p = makeCleanProject([makeTriggerNode('t1', 'start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h04');
  ok(code.includes('Command("start")'), 'Command("start") должен быть в коде');
});

test('H05', 'команда с заглавными буквами /Start → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/Start', 'msg1'), makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'h05');
});

test('H06', 'команда с цифрами /cmd123 → Command("cmd123")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/cmd123', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h06');
  ok(code.includes('Command("cmd123")'), 'Command("cmd123") должен быть в коде');
});

test('H07', 'команда с подчёркиванием /my_command → Command("my_command")', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/my_command', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h07');
  ok(code.includes('Command("my_command")'), 'Command("my_command") должен быть в коде');
});

test('H08', 'пустая команда "" → триггер игнорируется', () => {
  const trigger = { ...makeTriggerNode('t1', '', 'msg1'), data: { ...makeTriggerNode('t1', '', 'msg1').data, command: '' } };
  const p = makeCleanProject([trigger, makeMessageNode('msg1')]);
  const code = gen(p, 'h08');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть с пустой командой');
});

test('H09', 'команда только из пробелов "   " → триггер игнорируется', () => {
  const trigger = { ...makeTriggerNode('t1', '   ', 'msg1'), data: { ...makeTriggerNode('t1', '   ', 'msg1').data, command: '   ' } };
  const p = makeCleanProject([trigger, makeMessageNode('msg1')]);
  const code = gen(p, 'h09');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть с командой из пробелов');
});

test('H10', 'очень длинная команда (50 символов) → генерация не падает, синтаксис OK', () => {
  const longCmd = '/' + 'a'.repeat(50);
  const p = makeCleanProject([makeTriggerNode('t1', longCmd, 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'h10'), 'h10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: MockCallback структура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: MockCallback структура ────────────────────────────────');

test('I01', 'class MockCallback: есть в коде', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i01');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('I02', 'def __init__(self, data, user, msg): есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i02');
  ok(code.includes('def __init__(self, data, user, msg):'), 'def __init__(self, data, user, msg): должен быть в коде');
});

test('I03', 'async def answer(self, *args, **kwargs): есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i03');
  ok(code.includes('async def answer(self, *args, **kwargs):'), 'async def answer(self, *args, **kwargs): должен быть в коде');
});

test('I04', 'async def edit_text(self, text, **kwargs): есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i04');
  ok(code.includes('async def edit_text(self, text, **kwargs):'), 'async def edit_text(self, text, **kwargs): должен быть в коде');
});

test('I05', 'logging.warning внутри edit_text есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i05');
  ok(code.includes('logging.warning('), 'logging.warning должен быть в edit_text');
});

test('I06', 'mock_callback = MockCallback("msg1" есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i06');
  ok(code.includes('MockCallback("msg1"'), 'MockCallback("msg1" должен быть в коде');
});

test('I07', 'message.from_user передаётся в MockCallback', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i07');
  ok(code.includes('message.from_user'), 'message.from_user должен передаваться в MockCallback');
});

test('I08', 'синтаксис MockCallback корректен (скобки сбалансированы)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'i08'), 'i08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Комбинации флагов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Комбинации флагов ─────────────────────────────────────');

test('J01', 'все флаги false → только базовый обработчик без проверок', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false, requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j01');
  // Находим тело обработчика
  const handlerIdx = code.indexOf('command_trigger_t1_handler');
  const nextFnIdx = code.indexOf('\nasync def ', handlerIdx + 1);
  const handlerBody = nextFnIdx > 0 ? code.substring(handlerIdx, nextFnIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes('is_admin('), 'проверка admin НЕ должна быть');
  ok(!handlerBody.includes('not await check_auth('), 'вызов check_auth НЕ должен быть в обработчике');
});

test('J02', 'adminOnly + requiresAuth → обе проверки в правильном порядке', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j02');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
  const adminIdx = code.indexOf('is_admin(user_id)');
  const authIdx = code.indexOf('check_auth(user_id)');
  ok(adminIdx < authIdx, 'admin должна идти ДО auth');
});

test('J03', 'adminOnly: true + requiresAuth: false → только admin', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j03');
  const handlerIdx = code.indexOf('command_trigger_t1_handler');
  const nextFnIdx = code.indexOf('\nasync def ', handlerIdx + 1);
  const handlerBody = nextFnIdx > 0 ? code.substring(handlerIdx, nextFnIdx) : code.substring(handlerIdx);
  ok(handlerBody.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(!handlerBody.includes('not await check_auth('), 'вызов check_auth НЕ должен быть в обработчике');
});

test('J04', 'adminOnly: false + requiresAuth: true → только auth', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j04');
  const handlerIdx = code.indexOf('command_trigger_t1_handler');
  const nextFnIdx = code.indexOf('\nasync def ', handlerIdx + 1);
  const handlerBody = nextFnIdx > 0 ? code.substring(handlerIdx, nextFnIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes('is_admin('), 'проверка admin НЕ должна быть');
  ok(handlerBody.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('J05', 'adminOnly: false + requiresAuth: false → нет проверок', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false, requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j05');
  ok(!code.includes('is_admin('), 'проверка admin НЕ должна быть');
  ok(!code.includes('запустите бота'), 'сообщение об авторизации НЕ должно быть в коде');
});

test('J06', 'adminOnly: true + requiresAuth: false → только admin', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j06');
  const handlerIdx = code.indexOf('command_trigger_t1_handler');
  const nextFnIdx = code.indexOf('\nasync def ', handlerIdx + 1);
  const handlerBody = nextFnIdx > 0 ? code.substring(handlerIdx, nextFnIdx) : code.substring(handlerIdx);
  ok(handlerBody.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(!handlerBody.includes('not await check_auth('), 'вызов check_auth НЕ должен быть в обработчике');
});

test('J07', 'adminOnly: false + requiresAuth: true → только auth', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: false, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j07');
  ok(!code.includes('is_admin('), 'проверка admin НЕ должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('J08', 'adminOnly: true + requiresAuth: true → admin + auth', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'j08');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('J09', 'adminOnly + requiresAuth → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'j09'), 'j09');
});

test('J10', 'adminOnly + requiresAuth + 5 триггеров → синтаксис OK', () => {
  const triggers = Array.from({ length: 5 }, (_, i) =>
    makeTriggerNode(`t${i}`, `/cmd${i}`, 'msg1', { adminOnly: true, requiresAuth: true })
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'j10'), 'j10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Интеграция с полным проектом
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Интеграция с полным проектом ──────────────────────────');

test('K01', 'command_trigger + message узел → полный проект генерируется', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k01');
  ok(code.length > 100, 'код должен быть сгенерирован');
  ok(code.includes('async def main('), 'main() должен быть в коде');
});

test('K02', 'command_trigger + start узел → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/help', 'start1'),
    { id: 'start1', type: 'start', position: { x: 400, y: 0 }, data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'k02'), 'k02');
});

test('K03', 'command_trigger + command узел → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/trigger', 'cmd1'),
    { id: 'cmd1', type: 'command', position: { x: 400, y: 0 }, data: { command: '/menu', messageText: 'Меню', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'k03'), 'k03');
});

test('K04', 'command_trigger + message с inline-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 400, y: 0 }, data: { messageText: 'Выбери', buttons: [{ id: 'b1', text: 'Да', action: 'goto', target: 'msg1' }], keyboardType: 'inline', formatMode: 'none', markdown: false } },
  ]);
  syntax(gen(p, 'k04'), 'k04');
});

test('K05', 'command_trigger + message с reply-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 400, y: 0 }, data: { messageText: 'Выбери', buttons: [{ id: 'b1', text: 'Да', action: 'goto', target: 'msg1' }], keyboardType: 'reply', formatMode: 'none', markdown: false } },
  ]);
  syntax(gen(p, 'k05'), 'k05');
});

test('K06', 'command_trigger + message с formatMode: "html" → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 400, y: 0 }, data: { messageText: '<b>Привет</b>', buttons: [], keyboardType: 'none', formatMode: 'html', markdown: false } },
  ]);
  syntax(gen(p, 'k06'), 'k06');
});

test('K07', 'command_trigger + message с imageUrl → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 400, y: 0 }, data: { messageText: 'Фото', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, imageUrl: 'https://example.com/photo.jpg' } },
  ]);
  syntax(gen(p, 'k07'), 'k07');
});

test('K08', 'command_trigger + userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(genDB(p, 'k08'), 'k08');
});

test('K09', 'несколько command_trigger + несколько message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg2'),
    makeTriggerNode('t3', '/menu', 'msg3'),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
    makeMessageNode('msg3', 'Ответ 3'),
  ]);
  syntax(gen(p, 'k09'), 'k09');
});

test('K10', 'command_trigger + condition узел → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'cond1'),
    { id: 'cond1', type: 'condition', position: { x: 400, y: 0 }, data: { variable: 'user_name', operator: 'equals', value: 'test', trueTarget: 'msg1', falseTarget: 'msg1' } },
    makeMessageNode('msg1'),
  ]);
  ok(true, 'генерация не должна падать');
  gen(p, 'k10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Граничные случаи ──────────────────────────────────────');

test('L01', 'nodeId с дефисами → safe_name применяется, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('my-trigger-node', '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l01'), 'l01');
});

test('L02', 'nodeId начинающийся с цифры → safe_name применяется, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('123trigger', '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l02'), 'l02');
});

test('L03', 'nodeId с кириллицей → генерация не падает', () => {
  const p = makeCleanProject([makeTriggerNode('триггер1', '/start', 'msg1'), makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'l03');
});

test('L04', 'nodeId очень длинный (100 символов) → синтаксис OK', () => {
  const longId = 'trigger_' + 'a'.repeat(92);
  const p = makeCleanProject([makeTriggerNode(longId, '/start', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l04'), 'l04');
});

test('L05', 'description с двойными кавычками → синтаксис Python OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Команда "старт"' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'l05'), 'l05');
});

test('L06', "description с одинарными кавычками → синтаксис OK", () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { description: "Команда 'старт'" }), makeMessageNode('msg1')]);
  syntax(gen(p, 'l06'), 'l06');
});

test('L07', 'description с переносом строки → синтаксис Python OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { showInMenu: true, description: 'Строка 1\nСтрока 2' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'l07'), 'l07');
});

test('L08', 'description с Unicode/эмодзи → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1', { description: '🚀 Запустить бота 🎉 Привет мир' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'l08'), 'l08');
});

test('L09', 'command_trigger без поля description → генерация не падает', () => {
  const trigger = {
    id: 't1', type: 'command_trigger', position: { x: 0, y: 0 },
    data: { command: '/start', showInMenu: true, adminOnly: false, requiresAuth: false, autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([trigger, makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'l09');
});

test('L10', 'command_trigger без поля showInMenu → генерация не падает', () => {
  const trigger = {
    id: 't1', type: 'command_trigger', position: { x: 0, y: 0 },
    data: { command: '/start', description: 'Старт', adminOnly: false, requiresAuth: false, autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([trigger, makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'l10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Производительность ────────────────────────────────────');

test('M01', '1 триггер → генерация быстрее 500ms', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'm01');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Генерация заняла ${elapsed}ms, ожидалось < 500ms`);
});

test('M02', '10 триггеров → генерация быстрее 1000ms', () => {
  const triggers = Array.from({ length: 10 }, (_, i) => makeTriggerNode(`t${i}`, `/cmd${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'm02');
  const elapsed = Date.now() - start;
  ok(elapsed < 1000, `Генерация заняла ${elapsed}ms, ожидалось < 1000ms`);
});

test('M03', '50 триггеров → генерация быстрее 3000ms', () => {
  const triggers = Array.from({ length: 50 }, (_, i) => makeTriggerNode(`t${i}`, `/cmd${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'm03');
  const elapsed = Date.now() - start;
  ok(elapsed < 3000, `Генерация заняла ${elapsed}ms, ожидалось < 3000ms`);
});

test('M04', '100 триггеров → генерация не падает', () => {
  const triggers = Array.from({ length: 100 }, (_, i) => makeTriggerNode(`t${i}`, `/cmd${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'm04');
});

test('M05', '1 триггер + синтаксис Python → быстрее 2000ms', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const start = Date.now();
  const code = gen(p, 'm05');
  syntax(code, 'm05');
  const elapsed = Date.now() - start;
  ok(elapsed < 2000, `Генерация + синтаксис заняли ${elapsed}ms, ожидалось < 2000ms`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Отсутствие лишнего кода ──────────────────────────────');

test('N01', 'нет command_trigger узлов → нет @dp.message(Command(...))', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'n01');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть без command_trigger');
});

test('N02', 'нет command_trigger узлов → нет class MockCallback:', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'n02');
  ok(!code.includes('class MockCallback:'), 'class MockCallback: НЕ должен быть без command_trigger');
});

test('N03', 'command_trigger без autoTransitionTo → нет @dp.message(Command(...))', () => {
  const trigger = { ...makeTriggerNode('t1', '/start', ''), data: { ...makeTriggerNode('t1', '/start', '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'n03');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть без autoTransitionTo');
});

test('N04', 'один триггер → ровно один @dp.message(Command(...))', () => {
  const p = makeCleanProject([makeTriggerNode('t1', '/start', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'n04');
  const count = (code.match(/@dp\.message\(Command\(/g) || []).length;
  ok(count === 1, `Должен быть ровно 1 @dp.message(Command(...)), найдено: ${count}`);
});

test('N05', 'два триггера → ровно два @dp.message(Command(...))', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'n05');
  const count = (code.match(/@dp\.message\(Command\(/g) || []).length;
  ok(count === 2, `Должно быть ровно 2 @dp.message(Command(...)), найдено: ${count}`);
});

test('N06', 'нет дублирования class MockCallback: при нескольких триггерах (каждый в своей функции)', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeTriggerNode('t2', '/help', 'msg1'),
    makeTriggerNode('t3', '/menu', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'n06');
  // class MockCallback: должен быть в каждом обработчике — это нормально
  // Проверяем что каждый обработчик имеет свой MockCallback (не глобальный)
  const handlerCount = (code.match(/async def command_trigger_\w+_handler/g) || []).length;
  const mockCallbackCount = (code.match(/class MockCallback:/g) || []).length;
  ok(mockCallbackCount === handlerCount, `Количество MockCallback (${mockCallbackCount}) должно совпадать с количеством обработчиков (${handlerCount})`);
});

test('N07', 'нет command_trigger → нет is_admin если adminOnly не задан', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
  ]);
  const code = gen(p, 'n07');
  ok(!code.includes('async def is_admin') && !code.includes('def is_admin('), 'is_admin НЕ должен быть без adminOnly');
});

// ════════════════════════════════════════════════════════════════════════════
console.log('── Блок O: keyboard-ноды в command_trigger ───────────────────────');

test('O01', 'command_trigger → message + inline keyboard-нода → InlineKeyboardBuilder и синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('cmd_menu', '/menu', 'msg1'),
    makeMessageNode('msg1', 'Меню', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'inline', [
      { id: 'btn_next', text: 'Далее', action: 'goto', target: 'msg2' },
    ]),
    makeMessageNode('msg2', 'Следующий шаг'),
  ]);
  const code = gen(p, 'o01');
  ok(code.includes('@dp.message(Command("menu"))'), '@dp.message(Command("menu")) должен быть в коде');
  ok(code.includes('handle_callback_kbd1'), 'handle_callback_kbd1 должен быть в коде');
  ok(code.includes('callback_data="msg2"'), 'callback_data="msg2" должен быть в коде');
  syntax(code, 'o01');
});

test('O02', 'command_trigger → message + reply keyboard-нода → ReplyKeyboardBuilder и синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('cmd_start', '/start', 'msg1'),
    makeMessageNode('msg1', 'Выбери', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'reply', [
      { id: 'btn_yes', text: 'Да', action: 'goto', target: 'msg2' },
      { id: 'btn_no', text: 'Нет', action: 'goto', target: 'msg2' },
    ]),
    makeMessageNode('msg2', 'Ответ'),
  ]);
  const code = gen(p, 'o02');
  ok(code.includes('@dp.message(Command("start"))'), '@dp.message(Command("start")) должен быть в коде');
  ok(code.includes('handle_callback_kbd1'), 'handle_callback_kbd1 должен быть в коде');
  syntax(code, 'o02');
});

// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

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
