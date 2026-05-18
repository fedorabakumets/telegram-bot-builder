/**
 * @fileoverview Интеграционные тесты для узла bot_table (фаза 29)
 *
 * Блок A: Базовая генерация
 * Блок B: Все операции (read/insert/update/upsert/delete)
 * Блок C: Атомарность и кеш
 * Блок D: Автопереход
 * Блок E: Интеграция с другими узлами (27 сценариев из спеки)
 * Блок F: Переменные в tableName
 * Блок G: Полные сценарии
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
  return generatePythonCode(project as any, { botName: `Phase29_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p29_${label}.py`;
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

/** Создаёт узел bot_table */
function makeBotTableNode(id: string, data: any) {
  return { id, type: 'bot_table', position: { x: 0, y: 0 }, data: { buttons: [], keyboardType: 'none', ...data } };
}

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'OK') {
  return { id, type: 'message', position: { x: 400, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт command_trigger узел */
function makeCommandTrigger(id: string, command: string, targetId: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command, showInMenu: true, autoTransitionTo: targetId, buttons: [], keyboardType: 'none' } };
}

/** Создаёт text_trigger узел */
function makeTextTrigger(id: string, synonyms: string[], targetId: string) {
  return { id, type: 'text_trigger', position: { x: 0, y: 0 }, data: { textSynonyms: synonyms, textMatchType: 'exact', autoTransitionTo: targetId, buttons: [], keyboardType: 'none' } };
}

/** Создаёт condition узел */
function makeConditionNode(id: string, variable: string, branches: any[]) {
  return { id, type: 'condition', position: { x: 300, y: 0 }, data: { variable, branches, buttons: [], keyboardType: 'none' } };
}

/** Создаёт schedule_trigger узел */
function makeScheduleNode(id: string, targetId: string, rules: any[] = [{ mode: 'interval', intervalMinutes: 5 }]) {
  return { id, type: 'schedule_trigger', position: { x: 0, y: 0 }, data: { rules, timezone: 'Europe/Moscow', autoTransitionTo: targetId, enabled: true, maxConcurrent: 1, buttons: [], keyboardType: 'none' } };
}

/** Создаёт loop узел */
function makeLoopNode(id: string, source: string, item: string, targetId: string, afterId = '') {
  return { id, type: 'loop', position: { x: 0, y: 0 }, data: { sourceVariable: source, itemVariable: item, indexVariable: 'index', parallel: false, delaySeconds: 0, maxIterations: 0, autoTransitionTo: targetId, afterLoopTo: afterId, enableAutoTransition: true, buttons: [], keyboardType: 'none', messageText: '' } };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 29 — Узел bot_table (Работа с таблицами)             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация (10 тестов)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'read → содержит async def handle_callback_', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('async def handle_callback_'), 'async def handle_callback_ должен быть в коде');
});

test('A02', 'read → содержит db_pool', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('db_pool'), 'db_pool должен быть в коде');
});

test('A03', 'read → содержит bot_tables', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('bot_tables'), 'bot_tables должен быть в коде');
});

test('A04', 'read → содержит bot_table_columns', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('bot_table_columns'), 'bot_table_columns должен быть в коде');
});

test('A05', 'read → содержит bot_table_rows', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('bot_table_rows'), 'bot_table_rows должен быть в коде');
});

test('A06', 'read → содержит replace_variables_in_text', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
});

test('A07', 'read → содержит init_all_user_vars', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('init_all_user_vars'), 'init_all_user_vars должен быть в коде');
});

test('A08', 'read → синтаксис OK', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a08'), 'a08');
});

test('A09', 'insert → синтаксис OK', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'insert', row: { telegram_id: '{user_id}', balance: '100' }, autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'update → синтаксис OK', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'set', value: '50' }], autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Все операции (10 тестов)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Все операции ──────────────────────────────────────────');

test('B01', 'read с WHERE → содержит условие фильтрации', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: '' })]);
  const code = gen(p, 'b01');
  ok(code.includes('_match') || code.includes('telegram_id'), 'условие фильтрации должно быть в коде');
});

test('B02', 'read с saveResultTo → содержит user_data[user_id]', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'profile', resultFormat: 'first_row', autoTransitionTo: '' })]);
  const code = gen(p, 'b02');
  ok(code.includes('user_data[user_id]'), 'user_data[user_id] должен быть в коде');
});

test('B03', 'insert с row → содержит INSERT INTO bot_table_rows', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'insert', row: { telegram_id: '{user_id}', balance: '100' }, autoTransitionTo: '' })]);
  const code = gen(p, 'b03');
  ok(code.includes('INSERT INTO bot_table_rows'), 'INSERT INTO bot_table_rows должен быть в коде');
});

test('B04', 'insert → автосоздание таблицы (INSERT INTO bot_tables)', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'insert', row: { telegram_id: '{user_id}', balance: '100' }, autoTransitionTo: '' })]);
  const code = gen(p, 'b04');
  ok(code.includes('INSERT INTO bot_tables'), 'INSERT INTO bot_tables (автосоздание) должен быть в коде');
});

test('B05', 'update с increment → содержит COALESCE и jsonb_build_object', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'reputation', op: 'increment', value: '10' }], autoTransitionTo: '' })]);
  const code = gen(p, 'b05');
  ok(code.includes('COALESCE') && code.includes('jsonb_build_object'), 'COALESCE и jsonb_build_object должны быть в коде');
});

test('B06', 'update с decrement → содержит вычитание', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'decrement', value: '50' }], autoTransitionTo: '' })]);
  const code = gen(p, 'b06');
  ok(code.includes('- $2'), 'вычитание (- $2) должно быть в коде');
});

test('B07', 'update с min → содержит LEAST', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'reputation', op: 'min', value: '50' }], autoTransitionTo: '' })]);
  const code = gen(p, 'b07');
  ok(code.includes('LEAST'), 'LEAST должен быть в коде');
});

test('B08', 'update с max → содержит GREATEST', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'reputation', op: 'max', value: '100' }], autoTransitionTo: '' })]);
  const code = gen(p, 'b08');
  ok(code.includes('GREATEST'), 'GREATEST должен быть в коде');
});

test('B09', 'upsert → содержит поиск по ключу и вставку', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'upsert', key: 'telegram_id', row: { telegram_id: '{user_id}', balance: '100' }, onConflict: 'ignore', saveResultTo: 'profile', resultFormat: 'first_row', autoTransitionTo: '' })]);
  const code = gen(p, 'b09');
  ok(code.includes('_key_value') || code.includes('_found_row'), 'поиск по ключу должен быть в коде');
  ok(code.includes('INSERT INTO bot_table_rows'), 'вставка должна быть в коде');
});

test('B10', 'delete → содержит DELETE FROM bot_table_rows', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'relationships', operation: 'delete', where: [{ column: 'user_a', value: '{user_id}' }], autoTransitionTo: '' })]);
  const code = gen(p, 'b10');
  ok(code.includes('DELETE FROM bot_table_rows'), 'DELETE FROM bot_table_rows должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Атомарность и кеш (5 тестов)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Атомарность и кеш ─────────────────────────────────────');

test('C01', 'increment через SQL, не через Python math', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'reputation', op: 'increment', value: '10' }], autoTransitionTo: '' })]);
  const code = gen(p, 'c01');
  // Должен быть атомарный SQL, а не Python math
  ok(code.includes('COALESCE((data->>$1)::int, 0) + $2'), 'атомарный SQL increment должен быть в коде');
  ok(!code.includes('_old_val + 10'), 'Python math НЕ должен быть в коде');
});

test('C02', 'инвалидация кеша _bot_tables_cache = None после update', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'set', value: '0' }], autoTransitionTo: '' })]);
  const code = gen(p, 'c02');
  ok(code.includes('_bot_tables_cache = None'), '_bot_tables_cache = None должен быть после update');
});

test('C03', 'инвалидация кеша после insert', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'insert', row: { telegram_id: '{user_id}' }, autoTransitionTo: '' })]);
  const code = gen(p, 'c03');
  ok(code.includes('_bot_tables_cache = None'), '_bot_tables_cache = None должен быть после insert');
});

test('C04', 'инвалидация кеша после upsert', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'upsert', key: 'telegram_id', row: { telegram_id: '{user_id}', balance: '100' }, onConflict: 'ignore', autoTransitionTo: '' })]);
  const code = gen(p, 'c04');
  ok(code.includes('_bot_tables_cache = None'), '_bot_tables_cache = None должен быть после upsert');
});

test('C05', 'инвалидация кеша после delete', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'relationships', operation: 'delete', where: [{ column: 'user_a', value: '{user_id}' }], autoTransitionTo: '' })]);
  const code = gen(p, 'c05');
  ok(code.includes('_bot_tables_cache = None'), '_bot_tables_cache = None должен быть после delete');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Автопереход (5 тестов)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Автопереход ───────────────────────────────────────────');

test('D01', 'autoTransitionTo → содержит FakeCallback', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'd01');
  ok(code.includes('FakeCallback'), 'FakeCallback должен быть в коде');
});

test('D02', 'autoTransitionTo → содержит handle_callback_{target}', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'd02');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('D03', 'без autoTransitionTo → НЕ содержит FakeCallback', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: '' })]);
  const code = gen(p, 'd03');
  ok(!code.includes('FakeCallback'), 'FakeCallback НЕ должен быть без autoTransitionTo');
});

test('D04', 'autoTransitionTo к message-ноде → синтаксис OK', () => {
  const p = makeCleanProject([makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }), makeMessageNode('msg1', 'Баланс: {me.balance}')]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'autoTransitionTo к другому bot_table → синтаксис OK', () => {
  const p = makeCleanProject([
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'tbl2' }),
    makeBotTableNode('tbl2', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'increment', value: '10' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Интеграция с другими узлами — ВСЕ ПРИМЕРЫ ИЗ СПЕКИ (27 тестов)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Интеграция с другими узлами (27 сценариев) ─────────────');

test('E01', 'Регистрация при /start → upsert profiles', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'upsert', key: 'telegram_id', row: { telegram_id: '{user_id}', balance: '100', reputation: '100' }, onConflict: 'ignore', saveResultTo: 'profile', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Добро пожаловать!'),
  ]);
  syntax(gen(p, 'e01'), 'e01');
});

test('E02', 'Просмотр своего профиля → read profiles WHERE telegram_id={user_id}', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/profile', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Баланс: {me.balance}'),
  ]);
  syntax(gen(p, 'e02'), 'e02');
});

test('E03', 'Просмотр чужого профиля → read WHERE telegram_id={reply_to_user_id}', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/profile', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], saveResultTo: 'target', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Профиль: {target.reputation}'),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

test('E04', 'Установить возраст → update SET age', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/setage', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'age', op: 'set', value: '{user_input}' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Возраст сохранён'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

test('E05', 'Установить био → update SET bio', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/setbio', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'bio', op: 'set', value: '{user_input}' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Био обновлено'),
  ]);
  syntax(gen(p, 'e05'), 'e05');
});

test('E06', '+реп → update increment reputation', () => {
  const p = makeCleanProject([
    makeTextTrigger('txt1', ['+реп', '+rep'], 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'reputation', op: 'increment', value: '10' }], saveResultTo: 'rep_result', resultFormat: 'first_row', returnColumns: ['reputation'], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Репутация: {rep_result.reputation}'),
  ]);
  syntax(gen(p, 'e06'), 'e06');
});

test('E07', '-реп → update decrement reputation', () => {
  const p = makeCleanProject([
    makeTextTrigger('txt1', ['-реп', '-rep'], 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'reputation', op: 'decrement', value: '10' }], saveResultTo: 'rep_result', resultFormat: 'first_row', returnColumns: ['reputation'], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '⬇️ Репутация: {rep_result.reputation}'),
  ]);
  syntax(gen(p, 'e07'), 'e07');
});

test('E08', 'Ежедневный сброс → schedule + update SET reputation=50', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'tbl1', [{ mode: 'weekday', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hour: 0, minute: 0 }]),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'update', where: [{ column: 'reputation', value: '50', operator: 'less_than' }], updates: [{ column: 'reputation', op: 'set', value: '50' }], autoTransitionTo: '' }),
  ]);
  syntax(gen(p, 'e08'), 'e08');
});

test('E09', 'Магазин — показать товары → command + message с кнопками', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/shop', 'msg1'),
    makeMessageNode('msg1', '🛒 Магазин:\n1. +10 реп — 50🍪\n2. Сброс лимитов — 100🍪'),
  ]);
  syntax(gen(p, 'e09'), 'e09');
});

test('E10', 'Покупка +10 реп → read + condition + update balance-50, reputation+10', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/buy_rep', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.balance', [{ id: 'b1', operator: 'gte', value: '50', targetNodeId: 'tbl_upd' }]),
    makeBotTableNode('tbl_upd', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'decrement', value: '50' }, { column: 'reputation', op: 'increment', value: '10' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Куплено!'),
  ]);
  syntax(gen(p, 'e10'), 'e10');
});

test('E11', 'Покупка сброса лимитов → read + condition + update balance-100 + update actions_today=0', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/buy_reset', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.balance', [{ id: 'b1', operator: 'gte', value: '100', targetNodeId: 'tbl_upd1' }]),
    makeBotTableNode('tbl_upd1', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'decrement', value: '100' }], autoTransitionTo: 'tbl_upd2' }),
    makeBotTableNode('tbl_upd2', { tableName: 'relationships', operation: 'update', where: [{ column: 'user_a', value: '{user_id}' }], updates: [{ column: 'actions_today', op: 'set', value: '0' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Лимиты сброшены!'),
  ]);
  syntax(gen(p, 'e11'), 'e11');
});

test('E12', 'Покупка префикса → read + condition + update balance-200, prefix', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/buy_prefix', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.balance', [{ id: 'b1', operator: 'gte', value: '200', targetNodeId: 'tbl_upd' }]),
    makeBotTableNode('tbl_upd', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'decrement', value: '200' }, { column: 'prefix', op: 'set', value: '{prefix_input}' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Префикс установлен'),
  ]);
  syntax(gen(p, 'e12'), 'e12');
});

test('E13', 'Обнять → upsert relationships + read + condition + update score+5 + update balance+5', () => {
  const p = makeCleanProject([
    makeTextTrigger('txt1', ['обнять'], 'tbl_upsert'),
    makeBotTableNode('tbl_upsert', { tableName: 'relationships', operation: 'upsert', key: 'pair_id', row: { pair_id: '{user_id}_{reply_to_user_id}', score: '0', actions_today: '0' }, onConflict: 'ignore', saveResultTo: 'rel', resultFormat: 'first_row', autoTransitionTo: 'tbl_read' }),
    makeBotTableNode('tbl_read', { tableName: 'relationships', operation: 'read', where: [{ column: 'pair_id', value: '{user_id}_{reply_to_user_id}' }], saveResultTo: 'rel', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'rel.actions_today', [{ id: 'b1', operator: 'lt', value: '3', targetNodeId: 'tbl_upd1' }]),
    makeBotTableNode('tbl_upd1', { tableName: 'relationships', operation: 'update', where: [{ column: 'pair_id', value: '{user_id}_{reply_to_user_id}' }], updates: [{ column: 'score', op: 'increment', value: '5' }, { column: 'actions_today', op: 'increment', value: '1' }], autoTransitionTo: 'tbl_upd2' }),
    makeBotTableNode('tbl_upd2', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'increment', value: '5' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '🤗 Вы обняли!'),
  ]);
  syntax(gen(p, 'e13'), 'e13');
});

test('E14', 'Пнуть → update score-5, actions_today+1', () => {
  const p = makeCleanProject([
    makeTextTrigger('txt1', ['пнуть'], 'tbl_upsert'),
    makeBotTableNode('tbl_upsert', { tableName: 'relationships', operation: 'upsert', key: 'pair_id', row: { pair_id: '{user_id}_{reply_to_user_id}', score: '0', actions_today: '0' }, onConflict: 'ignore', autoTransitionTo: 'tbl_upd' }),
    makeBotTableNode('tbl_upd', { tableName: 'relationships', operation: 'update', where: [{ column: 'pair_id', value: '{user_id}_{reply_to_user_id}' }], updates: [{ column: 'score', op: 'decrement', value: '5' }, { column: 'actions_today', op: 'increment', value: '1' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '👊 Вы пнули!'),
  ]);
  syntax(gen(p, 'e14'), 'e14');
});

test('E15', 'Назначить ранг → read + condition + update rank', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/setrank', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.rank', [{ id: 'b1', operator: 'eq', value: 'headadmin', targetNodeId: 'tbl_upd' }]),
    makeBotTableNode('tbl_upd', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'rank', op: 'set', value: '{new_rank}' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Ранг назначен'),
  ]);
  syntax(gen(p, 'e15'), 'e15');
});

test('E16', 'Мут пользователя → read + condition (rank check)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/mute', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.rank', [{ id: 'b1', operator: 'eq', value: 'admin', targetNodeId: 'tbl_log' }]),
    makeBotTableNode('tbl_log', { tableName: 'action_log', operation: 'insert', row: { action: 'mute', target_id: '{reply_to_user_id}', timestamp: '{__now__}' }, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '🔇 Замучен'),
  ]);
  syntax(gen(p, 'e16'), 'e16');
});

test('E17', 'Автосообщения настройка → upsert settings', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/autoset', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'settings', operation: 'upsert', key: 'setting_key', row: { setting_key: 'auto_message_{chat_id}', message_text: '{user_input}', enabled: 'true' }, onConflict: 'update', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Автосообщение сохранено'),
  ]);
  syntax(gen(p, 'e17'), 'e17');
});

test('E18', 'Автосообщения отправка → schedule + read settings', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'tbl1', [{ mode: 'interval', intervalMinutes: 10 }]),
    makeBotTableNode('tbl1', { tableName: 'settings', operation: 'read', where: [{ column: 'setting_key', value: 'auto_message_{chat_id}' }], saveResultTo: 'auto_cfg', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '{auto_cfg.message_text}'),
  ]);
  syntax(gen(p, 'e18'), 'e18');
});

test('E19', 'Топ-10 → read all_rows orderBy reputation', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/top', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [], saveResultTo: 'all_users', resultFormat: 'all_rows', orderBy: 'reputation', orderDirection: 'desc', limit: 10, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '🏆 Топ репутации'),
  ]);
  syntax(gen(p, 'e19'), 'e19');
});

test('E20', 'Статистика → read count', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/stats', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'profiles', operation: 'read', where: [], saveResultTo: 'users_count', resultFormat: 'count', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '👥 Всего: {users_count}'),
  ]);
  syntax(gen(p, 'e20'), 'e20');
});

test('E21', 'Проверка отношений → read relationships', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/relations', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'relationships', operation: 'read', where: [{ column: 'pair_id', value: '{user_id}_{reply_to_user_id}' }], saveResultTo: 'rel', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '💕 Отношения: {rel.score}/100'),
  ]);
  syntax(gen(p, 'e21'), 'e21');
});

test('E22', 'Ежедневный сброс лимитов → schedule + update actions_today=0', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'tbl1', [{ mode: 'weekday', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hour: 0, minute: 0 }]),
    makeBotTableNode('tbl1', { tableName: 'relationships', operation: 'update', where: [{ column: 'actions_today', value: '0', operator: 'greater_than' }], updates: [{ column: 'actions_today', op: 'set', value: '0' }], autoTransitionTo: '' }),
  ]);
  syntax(gen(p, 'e22'), 'e22');
});

test('E23', 'Логирование → insert action_log', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/action', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'action_log', operation: 'insert', row: { user_id: '{user_id}', target_id: '{reply_to_user_id}', action: 'test', timestamp: '{__now__}', chat_id: '{chat_id}' }, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Записано'),
  ]);
  syntax(gen(p, 'e23'), 'e23');
});

test('E24', 'Перевод 🍪 → read + condition + update balance-50 + update balance+50', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/give', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.balance', [{ id: 'b1', operator: 'gte', value: '50', targetNodeId: 'tbl_sub' }]),
    makeBotTableNode('tbl_sub', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'decrement', value: '50' }], autoTransitionTo: 'tbl_add' }),
    makeBotTableNode('tbl_add', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'balance', op: 'increment', value: '50' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Переведено 50🍪'),
  ]);
  syntax(gen(p, 'e24'), 'e24');
});

test('E25', 'Ежедневный бонус → read cooldowns + condition + update balance+25 + upsert cooldowns', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/daily', 'tbl_cd'),
    makeBotTableNode('tbl_cd', { tableName: 'cooldowns', operation: 'read', where: [{ column: 'action_key', value: '{user_id}_daily' }], saveResultTo: 'cd', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'cd.last_used_at', [{ id: 'b1', operator: 'eq', value: '', targetNodeId: 'tbl_bonus' }]),
    makeBotTableNode('tbl_bonus', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user_id}' }], updates: [{ column: 'balance', op: 'increment', value: '25' }], autoTransitionTo: 'tbl_cd_upd' }),
    makeBotTableNode('tbl_cd_upd', { tableName: 'cooldowns', operation: 'upsert', key: 'action_key', row: { action_key: '{user_id}_daily', last_used_at: '{__now__}' }, onConflict: 'update', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ +25🍪!'),
  ]);
  syntax(gen(p, 'e25'), 'e25');
});

test('E26', 'Бан → read + condition + update rank=banned', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/ban', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.rank', [{ id: 'b1', operator: 'eq', value: 'headadmin', targetNodeId: 'tbl_ban' }]),
    makeBotTableNode('tbl_ban', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'rank', op: 'set', value: 'banned' }], autoTransitionTo: 'tbl_log' }),
    makeBotTableNode('tbl_log', { tableName: 'action_log', operation: 'insert', row: { action: 'ban', target_id: '{reply_to_user_id}', timestamp: '{__now__}' }, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '🚫 Забанен'),
  ]);
  syntax(gen(p, 'e26'), 'e26');
});

test('E27', 'Разбан → read + condition + update rank=user', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/unban', 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.rank', [{ id: 'b1', operator: 'eq', value: 'headadmin', targetNodeId: 'tbl_unban' }]),
    makeBotTableNode('tbl_unban', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'rank', op: 'set', value: 'user' }], autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Разбанен'),
  ]);
  syntax(gen(p, 'e27'), 'e27');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Переменные в tableName (3 теста)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Переменные в tableName ─────────────────────────────────');

test('F01', 'tableName с переменной orders_{chat_id} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/orders', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'orders_{chat_id}', operation: 'read', where: [{ column: 'user_id', value: '{user_id}' }], saveResultTo: 'orders', resultFormat: 'all_rows', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Заказы загружены'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'tableName с переменной → содержит replace_variables_in_text', () => {
  const p = makeCleanProject([
    makeBotTableNode('tbl1', { tableName: 'orders_{chat_id}', operation: 'read', where: [], saveResultTo: 'orders', resultFormat: 'all_rows', autoTransitionTo: '' }),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('replace_variables_in_text') && code.includes('orders_{chat_id}'), 'replace_variables_in_text с orders_{chat_id} должен быть в коде');
});

test('F03', 'динамическое имя + insert → автосоздание таблицы', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/add', 'tbl1'),
    makeBotTableNode('tbl1', { tableName: 'data_{chat_id}', operation: 'insert', row: { item: '{user_input}', added_by: '{user_id}' }, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Добавлено'),
  ]);
  const code = gen(p, 'f03');
  ok(code.includes('INSERT INTO bot_tables'), 'автосоздание таблицы должно быть в коде');
  syntax(code, 'f03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Полные сценарии (3 теста)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Полные сценарии ────────────────────────────────────────');

test('G01', 'schedule → bot_table(read all) → loop → bot_table(update) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'tbl_read', [{ mode: 'interval', intervalMinutes: 60 }]),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [], saveResultTo: 'all_users', resultFormat: 'all_rows', autoTransitionTo: 'loop1' }),
    makeLoopNode('loop1', 'all_users', 'user', 'tbl_upd'),
    makeBotTableNode('tbl_upd', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{user.telegram_id}' }], updates: [{ column: 'daily_bonus', op: 'increment', value: '1' }], autoTransitionTo: '' }),
  ]);
  syntax(gen(p, 'g01'), 'g01');
});

test('G02', 'command_trigger → bot_table(upsert) → bot_table(read) → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'tbl_upsert'),
    makeBotTableNode('tbl_upsert', { tableName: 'profiles', operation: 'upsert', key: 'telegram_id', row: { telegram_id: '{user_id}', balance: '100', reputation: '100', rank: 'user' }, onConflict: 'ignore', saveResultTo: 'profile', resultFormat: 'first_row', autoTransitionTo: 'tbl_read' }),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Привет! Баланс: {me.balance}🍪'),
  ]);
  syntax(gen(p, 'g02'), 'g02');
});

test('G03', 'text_trigger → bot_table(read) → condition → bot_table(update) → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTextTrigger('txt1', ['+реп'], 'tbl_read'),
    makeBotTableNode('tbl_read', { tableName: 'profiles', operation: 'read', where: [{ column: 'telegram_id', value: '{user_id}' }], saveResultTo: 'me', resultFormat: 'first_row', autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'me.reputation', [{ id: 'b1', operator: 'gte', value: '50', targetNodeId: 'tbl_upd' }]),
    makeBotTableNode('tbl_upd', { tableName: 'profiles', operation: 'update', where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }], updates: [{ column: 'reputation', op: 'increment', value: '10' }], saveResultTo: 'result', resultFormat: 'first_row', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', '✅ Репутация обновлена'),
  ]);
  syntax(gen(p, 'g03'), 'g03');
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

console.log('\n✅ Все тесты фазы 29 (bot_table) пройдены!\n');
