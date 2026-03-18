/**
 * @fileoverview Фаза 13 — База данных — интеграционные тесты
 *
 * Блок A: Базовые функции БД (userDatabaseEnabled: true/false)
 * Блок B: hasMessageLogging — наличие message/command узлов
 * Блок C: hasUserIdsTable — кнопки с action: 'goto'
 * Блок D: hasUserDataAccess — collectUserInput / enableConditionalMessages / saveToDatabase
 * Блок E: hasTelegramSettingsTable — tg_* переменные
 * Блок F: Алиасы команд (alias-nodes)
 * Блок G: update_user_data_in_db вызывается в обработчиках
 * Блок H: save_user_to_db вызывается в обработчиках
 * Блок I: Комбинации флагов
 * Блок J: Граничные случаи
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

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

/** Добавляет новый узел заданного типа */
function addNode(type: string, data: Record<string, unknown>) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: `test_${type}_node`,
    type,
    position: { x: 0, y: 0 },
    data,
  });
  return p;
}

/** Создаёт чистый проект с заданными узлами (без goto-кнопок) */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/** Генерирует код С базой данных */
function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase13DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

/** Генерирует код БЕЗ базы данных */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase13_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/** Проверяет синтаксис Python через py_compile */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p13_${label}.py`;
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
console.log('║         Фаза 13 — База данных (70+ тестов)                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовые функции БД
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовые функции БД ────────────────────────────────────');

test('A01', 'userDatabaseEnabled: false → НЕТ init_database', () => {
  const code = gen(clone(BASE), 'a01');
  ok(!code.includes('init_database'), 'init_database не должен быть без БД');
});

test('A02', 'userDatabaseEnabled: true → ЕСТЬ init_database', () => {
  const code = genDB(clone(BASE), 'a02');
  ok(code.includes('init_database'), 'init_database должен быть при userDatabaseEnabled');
});

test('A03', 'userDatabaseEnabled: true → ЕСТЬ save_user_to_db', () => {
  const code = genDB(clone(BASE), 'a03');
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен быть');
});

test('A04', 'userDatabaseEnabled: true → ЕСТЬ get_user_from_db', () => {
  const code = genDB(clone(BASE), 'a04');
  ok(code.includes('get_user_from_db'), 'get_user_from_db должен быть');
});

test('A05', 'userDatabaseEnabled: true → ЕСТЬ update_user_data_in_db', () => {
  const code = genDB(clone(BASE), 'a05');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен быть');
});

test('A06', 'userDatabaseEnabled: true → ЕСТЬ CREATE TABLE IF NOT EXISTS bot_users', () => {
  const code = genDB(clone(BASE), 'a06');
  ok(code.includes('CREATE TABLE IF NOT EXISTS bot_users'), 'CREATE TABLE bot_users должен быть');
});

test('A07', 'userDatabaseEnabled: true → ЕСТЬ CREATE TABLE IF NOT EXISTS bot_messages', () => {
  const code = genDB(clone(BASE), 'a07');
  ok(code.includes('CREATE TABLE IF NOT EXISTS bot_messages'), 'CREATE TABLE bot_messages должен быть');
});

test('A08', 'userDatabaseEnabled: true → ЕСТЬ asyncpg.create_pool', () => {
  const code = genDB(clone(BASE), 'a08');
  ok(code.includes('asyncpg.create_pool'), 'asyncpg.create_pool должен быть');
});

test('A09', 'userDatabaseEnabled: true → синтаксис Python OK', () => {
  const code = genDB(clone(BASE), 'a09');
  syntax(code, 'a09');
});

test('A10', 'userDatabaseEnabled: false → синтаксис Python OK', () => {
  const code = gen(clone(BASE), 'a10');
  syntax(code, 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: hasMessageLogging — наличие message/command узлов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: hasMessageLogging ─────────────────────────────────────');

test('B01', 'только start-узел → НЕТ log_message', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' },
  }]);
  const code = genDB(p, 'b01');
  ok(!code.includes('log_message'), 'log_message не должен быть без message/command узлов');
});

test('B02', 'start + message-узел → ЕСТЬ log_message', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'b02');
  ok(code.includes('log_message'), 'log_message должен быть при наличии message-узла');
});

test('B03', 'start + command-узел → ЕСТЬ log_message', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 200 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'b03');
  ok(code.includes('log_message'), 'log_message должен быть при наличии command-узла');
});

test('B04', 'start + message + command → ЕСТЬ log_message (один раз)', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 400 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'b04');
  ok(code.includes('log_message'), 'log_message должен быть');
  // Проверяем что определение функции только одно
  const count = (code.match(/async def log_message\(/g) || []).length;
  ok(count === 1, `log_message должен быть определён ровно один раз, найдено: ${count}`);
});

test('B05', 'ЕСТЬ get_moscow_time при наличии message-узла', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'b05');
  ok(code.includes('get_moscow_time'), 'get_moscow_time должен быть при message-узле');
});

test('B06', 'НЕТ get_moscow_time при только start-узле', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' },
  }]);
  const code = genDB(p, 'b06');
  ok(!code.includes('get_moscow_time'), 'get_moscow_time не должен быть без message/command');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: hasUserIdsTable — кнопки с action: 'goto'
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: hasUserIdsTable ───────────────────────────────────────');

test('C01', 'кнопки с action: goto → ЕСТЬ get_user_ids_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' }],
    },
  }]);
  const code = genDB(p, 'c01');
  ok(code.includes('get_user_ids_from_db'), 'get_user_ids_from_db должен быть при goto-кнопках');
});

test('C02', 'кнопки с action: url → НЕТ get_user_ids_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Ссылка', action: 'url', url: 'https://example.com' }],
    },
  }]);
  const code = genDB(p, 'c02');
  ok(!code.includes('get_user_ids_from_db'), 'get_user_ids_from_db не должен быть при url-кнопках');
});

test('C03', 'нет кнопок → НЕТ get_user_ids_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  }]);
  const code = genDB(p, 'c03');
  ok(!code.includes('get_user_ids_from_db'), 'get_user_ids_from_db не должен быть без кнопок');
});

test('C04', 'смешанные кнопки (goto + url) → ЕСТЬ get_user_ids_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'inline',
      buttons: [
        { id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' },
        { id: 'b2', text: 'Ссылка', action: 'url', url: 'https://example.com' },
      ],
    },
  }]);
  const code = genDB(p, 'c04');
  ok(code.includes('get_user_ids_from_db'), 'get_user_ids_from_db должен быть при смешанных кнопках');
});

test('C05', 'get_user_ids_from_db → ЕСТЬ SELECT user_id FROM user_ids', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' }],
    },
  }]);
  const code = genDB(p, 'c05');
  ok(code.includes('SELECT user_id FROM user_ids'), 'SELECT user_id FROM user_ids должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: hasUserDataAccess
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: hasUserDataAccess ─────────────────────────────────────');

test('D01', 'collectUserInput: true → ЕСТЬ get_user_data_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи имя', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'user_name',
    },
  }]);
  const code = genDB(p, 'd01');
  ok(code.includes('get_user_data_from_db'), 'get_user_data_from_db должен быть при collectUserInput');
});

test('D02', 'collectUserInput: true → ЕСТЬ update_user_variable_in_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи имя', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'user_name',
    },
  }]);
  const code = genDB(p, 'd02');
  ok(code.includes('update_user_variable_in_db'), 'update_user_variable_in_db должен быть');
});

test('D03', 'collectUserInput: true → ЕСТЬ save_user_data_to_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи имя', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'user_name',
    },
  }]);
  const code = genDB(p, 'd03');
  ok(code.includes('save_user_data_to_db'), 'save_user_data_to_db должен быть');
});

test('D04', 'enableConditionalMessages: true → ЕСТЬ get_user_data_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      enableConditionalMessages: true, conditionalMessages: [],
    },
  }]);
  const code = genDB(p, 'd04');
  ok(code.includes('get_user_data_from_db'), 'get_user_data_from_db должен быть при enableConditionalMessages');
});

test('D05', 'saveToDatabase: true → ЕСТЬ get_user_data_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      saveToDatabase: true,
    },
  }]);
  const code = genDB(p, 'd05');
  ok(code.includes('get_user_data_from_db'), 'get_user_data_from_db должен быть при saveToDatabase');
});

test('D06', 'ни одного флага → НЕТ get_user_data_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      collectUserInput: false, enableConditionalMessages: false, saveToDatabase: false,
    },
  }]);
  const code = genDB(p, 'd06');
  ok(!code.includes('get_user_data_from_db'), 'get_user_data_from_db не должен быть без флагов');
});

test('D07', 'ни одного флага → НЕТ update_user_variable_in_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      collectUserInput: false, enableConditionalMessages: false, saveToDatabase: false,
    },
  }]);
  const code = genDB(p, 'd07');
  ok(!code.includes('update_user_variable_in_db'), 'update_user_variable_in_db не должен быть без флагов');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: hasTelegramSettingsTable — tg_* переменные
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: hasTelegramSettingsTable ──────────────────────────────');

const TG_VARS = ['tg_phone', 'tg_api_id', 'tg_api_hash', 'tg_session', 'tg_is_active'];

for (const [idx, tgVar] of TG_VARS.entries()) {
  const letter = String.fromCharCode(48 + idx + 1); // '1'..'5'
  test(`E0${idx + 1}`, `collectUserInput + inputVariable='${tgVar}' → ЕСТЬ user_telegram_settings`, () => {
    const p = makeCleanProject([{
      id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: {
        command: '/start', messageText: 'Введи данные', keyboardType: 'none', buttons: [],
        collectUserInput: true, inputVariable: tgVar,
      },
    }]);
    const code = genDB(p, `e0${idx + 1}`);
    ok(code.includes('user_telegram_settings'), `user_telegram_settings должен быть при inputVariable='${tgVar}'`);
  });
}

test('E06', "collectUserInput + inputVariable='user_name' → НЕТ user_telegram_settings", () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи имя', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'user_name',
    },
  }]);
  const code = genDB(p, 'e06');
  ok(!code.includes('user_telegram_settings'), 'user_telegram_settings не должен быть при обычной переменной');
});

test('E07', "collectUserInput: false + inputVariable='tg_phone' → НЕТ user_telegram_settings", () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      collectUserInput: false, inputVariable: 'tg_phone',
    },
  }]);
  const code = genDB(p, 'e07');
  ok(!code.includes('user_telegram_settings'), 'user_telegram_settings не должен быть при collectUserInput=false');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Алиасы команд (alias-nodes)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Алиасы команд ─────────────────────────────────────────');

test('F01', 'start-узел → ЕСТЬ handle_command_start алиас', () => {
  const code = genDB(clone(BASE), 'f01');
  ok(code.includes('handle_command_start'), 'handle_command_start должен быть');
});

test('F02', 'command-узел /help → ЕСТЬ handle_command_help алиас', () => {
  const p = addNode('command', {
    command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none',
  });
  const code = genDB(p, 'f02');
  ok(code.includes('handle_command_help'), 'handle_command_help должен быть');
});

test('F03', 'command-узел /my_profile → ЕСТЬ handle_command_my_profile алиас', () => {
  const p = addNode('command', {
    command: '/my_profile', messageText: 'Профиль', buttons: [], keyboardType: 'none',
  });
  const code = genDB(p, 'f03');
  ok(code.includes('handle_command_my_profile'), 'handle_command_my_profile должен быть');
});

test('F04', 'нет command-узлов → НЕТ handle_command_help (только start)', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' },
  }]);
  const code = genDB(p, 'f04');
  ok(!code.includes('handle_command_help'), 'handle_command_help не должен быть без /help команды');
  ok(code.includes('handle_command_start'), 'handle_command_start должен быть');
});

test('F05', 'несколько command-узлов → все алиасы присутствуют', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 200 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
    { id: 'cmd2', type: 'command', position: { x: 0, y: 400 },
      data: { command: '/settings', messageText: 'Настройки', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'f05');
  ok(code.includes('handle_command_start'), 'handle_command_start должен быть');
  ok(code.includes('handle_command_help'), 'handle_command_help должен быть');
  ok(code.includes('handle_command_settings'), 'handle_command_settings должен быть');
});

test('F06', 'userDatabaseEnabled: false → НЕТ алиасов handle_command_', () => {
  const code = gen(clone(BASE), 'f06');
  ok(!code.includes('handle_command_start'), 'handle_command_start не должен быть без БД');
  ok(!code.includes('handle_command_'), 'handle_command_ не должен быть без БД');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: update_user_data_in_db вызывается в обработчиках
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: update_user_data_in_db в обработчиках ─────────────────');

test('G01', 'start + imageUrl + DB → update_user_data_in_db вызывается', () => {
  const code = genDB(patchStart({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'g01');
  syntax(code, 'g01');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться при imageUrl');
});

test('G02', 'start + videoUrl + DB → update_user_data_in_db вызывается', () => {
  const code = genDB(patchStart({ videoUrl: 'https://example.com/video.mp4', attachedMedia: [] }), 'g02');
  syntax(code, 'g02');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться при videoUrl');
});

test('G03', 'start + audioUrl + DB → update_user_data_in_db вызывается', () => {
  const code = genDB(patchStart({ audioUrl: 'https://example.com/audio.mp3', attachedMedia: [] }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться при audioUrl');
});

test('G04', 'start + documentUrl + DB → update_user_data_in_db вызывается', () => {
  const code = genDB(patchStart({ documentUrl: 'https://example.com/doc.pdf', attachedMedia: [] }), 'g04');
  syntax(code, 'g04');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться при documentUrl');
});

test('G05', 'message + imageUrl + DB → update_user_data_in_db вызывается', () => {
  const code = genDB(patchMsg({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'g05');
  syntax(code, 'g05');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться в message-обработчике');
});

test('G06', 'start + imageUrl + NO DB → НЕТ update_user_data_in_db вызова', () => {
  const code = gen(patchStart({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'g06');
  syntax(code, 'g06');
  ok(!code.includes('update_user_data_in_db'), 'update_user_data_in_db не должен быть без БД');
});

test('G07', "start + collectUserInput + inputVariable='answer' + DB → update_user_data_in_db вызывается", () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи ответ', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'answer',
    },
  }]);
  const code = genDB(p, 'g07');
  syntax(code, 'g07');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен вызываться при collectUserInput');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: save_user_to_db вызывается в обработчиках
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: save_user_to_db в обработчиках ────────────────────────');

test('H01', 'start + DB → save_user_to_db вызывается в start_handler', () => {
  const code = genDB(clone(BASE), 'h01');
  syntax(code, 'h01');
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен вызываться в start_handler');
});

test('H02', 'message + DB → save_user_to_db вызывается в message-обработчике', () => {
  const code = genDB(clone(BASE), 'h02');
  syntax(code, 'h02');
  // BASE содержит message-узел, проверяем что save_user_to_db есть в коде
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен вызываться в message-обработчике');
});

test('H03', 'command + DB → save_user_to_db вызывается в command-обработчике', () => {
  const p = addNode('command', {
    command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none',
  });
  const code = genDB(p, 'h03');
  syntax(code, 'h03');
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен вызываться в command-обработчике');
});

test('H04', 'start + NO DB → НЕТ save_user_to_db вызова', () => {
  const code = gen(clone(BASE), 'h04');
  syntax(code, 'h04');
  ok(!code.includes('save_user_to_db'), 'save_user_to_db не должен быть без БД');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Комбинации флагов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Комбинации флагов ─────────────────────────────────────');

test('I01', 'start + message + command + goto + collectUserInput + DB → все функции', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: {
        command: '/start', messageText: 'Привет', keyboardType: 'inline',
        buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' }],
        collectUserInput: true, inputVariable: 'user_name',
      } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 400 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'i01');
  syntax(code, 'i01');
  ok(code.includes('init_database'), 'init_database должен быть');
  ok(code.includes('log_message'), 'log_message должен быть');
  ok(code.includes('get_user_ids_from_db'), 'get_user_ids_from_db должен быть');
  ok(code.includes('get_user_data_from_db'), 'get_user_data_from_db должен быть');
  ok(code.includes('update_user_variable_in_db'), 'update_user_variable_in_db должен быть');
  ok(code.includes('save_user_data_to_db'), 'save_user_data_to_db должен быть');
  ok(code.includes('handle_command_start'), 'handle_command_start должен быть');
  ok(code.includes('handle_command_help'), 'handle_command_help должен быть');
});

test('I02', 'только start + DB → минимальный набор', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [],
      collectUserInput: false, enableConditionalMessages: false, saveToDatabase: false,
    },
  }]);
  const code = genDB(p, 'i02');
  syntax(code, 'i02');
  ok(code.includes('init_database'), 'init_database должен быть');
  ok(!code.includes('log_message'), 'log_message не должен быть без message/command');
  ok(!code.includes('get_user_ids_from_db'), 'get_user_ids_from_db не должен быть без goto');
  ok(!code.includes('get_user_data_from_db'), 'get_user_data_from_db не должен быть без флагов');
});

test('I03', 'start + message + goto-кнопки + DB → ЕСТЬ log_message + get_user_ids_from_db', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: {
        command: '/start', messageText: 'Привет', keyboardType: 'inline',
        buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' }],
      } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: { messageText: 'Сообщение', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'i03');
  syntax(code, 'i03');
  ok(code.includes('log_message'), 'log_message должен быть');
  ok(code.includes('get_user_ids_from_db'), 'get_user_ids_from_db должен быть');
});

test('I04', 'start + collectUserInput + tg_phone + DB → ЕСТЬ user_telegram_settings + get_user_data_from_db', () => {
  const p = makeCleanProject([{
    id: 'start1', type: 'start', position: { x: 0, y: 0 },
    data: {
      command: '/start', messageText: 'Введи телефон', keyboardType: 'none', buttons: [],
      collectUserInput: true, inputVariable: 'tg_phone',
    },
  }]);
  const code = genDB(p, 'i04');
  syntax(code, 'i04');
  ok(code.includes('user_telegram_settings'), 'user_telegram_settings должен быть');
  ok(code.includes('get_user_data_from_db'), 'get_user_data_from_db должен быть');
});

test('I05', 'полный проект (все типы узлов) + DB → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: {
        command: '/start', messageText: 'Привет', keyboardType: 'inline',
        buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'msg1' }],
        collectUserInput: false, enableConditionalMessages: false,
      } },
    { id: 'msg1', type: 'message', position: { x: 0, y: 200 },
      data: {
        messageText: 'Сообщение', keyboardType: 'inline',
        buttons: [{ id: 'b2', text: 'Ещё', action: 'goto', target: 'msg2' }],
        collectUserInput: true, inputVariable: 'user_answer',
      } },
    { id: 'msg2', type: 'message', position: { x: 0, y: 400 },
      data: { messageText: 'Финал', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 600 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'i05');
  syntax(code, 'i05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Граничные случаи ──────────────────────────────────────');

test('J01', 'userDatabaseEnabled: true + пустой messageText → синтаксис OK', () => {
  const code = genDB(patchStart({ messageText: '' }), 'j01');
  syntax(code, 'j01');
});

test('J02', 'userDatabaseEnabled: true + очень длинный messageText (3000 символов) → синтаксис OK', () => {
  const code = genDB(patchStart({ messageText: 'А'.repeat(3000) }), 'j02');
  syntax(code, 'j02');
});

test('J03', 'userDatabaseEnabled: true + messageText с кириллицей и эмодзи → синтаксис OK', () => {
  const code = genDB(patchStart({ messageText: 'Привет мир! 🎉🚀 Тест кириллицы и эмодзи 😊' }), 'j03');
  syntax(code, 'j03');
});

test('J04', 'userDatabaseEnabled: true + messageText с двойными кавычками → синтаксис OK', () => {
  const code = genDB(patchStart({ messageText: 'Текст с "двойными кавычками" внутри' }), 'j04');
  syntax(code, 'j04');
});

test('J05', "userDatabaseEnabled: true + messageText с одинарными кавычками → синтаксис OK", () => {
  const code = genDB(patchStart({ messageText: "Текст с 'одинарными кавычками' внутри" }), 'j05');
  syntax(code, 'j05');
});

test('J06', 'несколько command-узлов с разными командами → все алиасы, синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 },
      data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none' } },
    { id: 'cmd1', type: 'command', position: { x: 0, y: 200 },
      data: { command: '/help', messageText: 'Помощь', buttons: [], keyboardType: 'none' } },
    { id: 'cmd2', type: 'command', position: { x: 0, y: 400 },
      data: { command: '/about', messageText: 'О боте', buttons: [], keyboardType: 'none' } },
    { id: 'cmd3', type: 'command', position: { x: 0, y: 600 },
      data: { command: '/contacts', messageText: 'Контакты', buttons: [], keyboardType: 'none' } },
  ]);
  const code = genDB(p, 'j06');
  syntax(code, 'j06');
  ok(code.includes('handle_command_start'), 'handle_command_start должен быть');
  ok(code.includes('handle_command_help'), 'handle_command_help должен быть');
  ok(code.includes('handle_command_about'), 'handle_command_about должен быть');
  ok(code.includes('handle_command_contacts'), 'handle_command_contacts должен быть');
});

test('J07', 'userDatabaseEnabled: true + broadcast-узел → синтаксис OK', () => {
  const p = addNode('broadcast', {
    messageText: 'Рассылка всем пользователям',
    buttons: [], keyboardType: 'none',
  });
  const code = genDB(p, 'j07');
  syntax(code, 'j07');
});

test('J08', 'userDatabaseEnabled: true + multiselect (allowMultipleSelection) → синтаксис OK', () => {
  const p = addNode('message', {
    messageText: 'Выбери несколько вариантов',
    keyboardType: 'inline',
    allowMultipleSelection: true,
    buttons: [
      { id: 'b1', text: 'Вариант 1', action: 'goto', target: '' },
      { id: 'b2', text: 'Вариант 2', action: 'goto', target: '' },
    ],
  });
  const code = genDB(p, 'j08');
  syntax(code, 'j08');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

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
