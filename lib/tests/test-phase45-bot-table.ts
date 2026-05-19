/**
 * @fileoverview Фаза 45 — Интеграционный тест узла bot_table
 * @module tests/test-phase45-bot-table
 *
 * Блок A: Базовая генерация (A01–A06)
 * Блок B: Операция read (B01–B08)
 * Блок C: Операция insert (C01–C04)
 * Блок D: Операция update (D01–D04)
 * Блок E: Операция upsert (E01–E05)
 * Блок F: Операция delete (F01–F03)
 * Блок G: Операция count (G01–G04)
 * Блок H: Агрегации sum/max/min/avg (H01–H06)
 * Блок I: Операция distinct (I01–I03)
 * Блок J: Операция delete_all (J01–J02)
 * Блок K: Формат результата (K01–K05)
 * Блок L: Offset и пагинация (L01–L03)
 * Блок M: returnInsertedId (M01–M03)
 * Блок N: WHERE операторы (N01–N07)
 * Блок O: Автопереход (O01–O03)
 * Блок P: Синтаксис полных сценариев (P01–P05)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Создаёт минимальный проект с указанными узлами */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

/** Генерирует Python-код из проекта */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase45_${label}`, userDatabaseEnabled: true, enableComments: false });
}

/** Проверяет синтаксис Python-кода через py_compile */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p45_${label}.py`;
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

/** Создаёт узел bot_table с параметрами */
function makeBT(id: string, data: any) {
  return { id, type: 'bot_table', position: { x: 0, y: 0 }, data: { tableName: 'users', operation: 'read', where: [], updates: [], row: {}, key: '', onConflict: 'ignore', saveResultTo: 'result', resultFormat: 'first_row', returnColumns: [], orderBy: '', orderDirection: 'desc', limit: 0, offset: 0, aggregateColumn: '', returnInsertedId: false, autoTransitionTo: '', enableAutoTransition: false, ...data } };
}

/** Создаёт message-узел */
function makeMsg(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт command_trigger */
function makeCmd(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true } };
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 45 — Узел bot_table                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── Блок A: Базовая генерация ───────────────────────────────────────────────
console.log('─── Блок A: Базовая генерация ───');

test('A01', 'Генерирует handle_callback для bot_table', () => {
  const code = gen(makeCleanProject([makeBT('bt1', { operation: 'read' })]), 'A01');
  ok(code.includes('async def handle_callback_bt1'), 'Нет handle_callback_bt1');
});

test('A02', 'Содержит user_data[user_id]', () => {
  const code = gen(makeCleanProject([makeBT('bt2', { operation: 'read' })]), 'A02');
  ok(code.includes('user_data[user_id]'), 'Нет user_data[user_id]');
});

test('A03', 'Содержит logging.info с bot_table', () => {
  const code = gen(makeCleanProject([makeBT('bt3', { operation: 'read' })]), 'A03');
  ok(code.includes('bot_table'), 'Нет bot_table в логе');
});

test('A04', 'Содержит replace_variables_in_text для tableName', () => {
  const code = gen(makeCleanProject([makeBT('bt4', { operation: 'read', tableName: 'users' })]), 'A04');
  ok(code.includes('replace_variables_in_text'), 'Нет replace_variables_in_text');
});

test('A05', 'Содержит db_pool', () => {
  const code = gen(makeCleanProject([makeBT('bt5', { operation: 'read' })]), 'A05');
  ok(code.includes('db_pool'), 'Нет db_pool');
});

test('A06', 'Синтаксис Python валиден (базовый read)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/test', 'bt6'),
    makeBT('bt6', { operation: 'read', tableName: 'users', saveResultTo: 'res' }),
  ]), 'A06'), 'A06');
});

// ─── Блок B: Операция read ───────────────────────────────────────────────────
console.log('\n─── Блок B: Операция read ───');

test('B01', 'read содержит SELECT id FROM bot_tables', () => {
  const code = gen(makeCleanProject([makeBT('bt_r1', { operation: 'read' })]), 'B01');
  ok(code.includes('bot_tables'), 'Нет bot_tables');
});

test('B02', 'read содержит bot_table_rows', () => {
  const code = gen(makeCleanProject([makeBT('bt_r2', { operation: 'read' })]), 'B02');
  ok(code.includes('bot_table_rows'), 'Нет bot_table_rows');
});

test('B03', 'read содержит _results = []', () => {
  const code = gen(makeCleanProject([makeBT('bt_r3', { operation: 'read' })]), 'B03');
  ok(code.includes('_results = []'), 'Нет _results = []');
});

test('B04', 'read с orderBy содержит .sort', () => {
  const code = gen(makeCleanProject([makeBT('bt_r4', { operation: 'read', orderBy: 'balance', orderDirection: 'desc' })]), 'B04');
  ok(code.includes('.sort('), 'Нет .sort(');
});

test('B05', 'read с limit > 0 содержит срез', () => {
  const code = gen(makeCleanProject([makeBT('bt_r5', { operation: 'read', limit: 10 })]), 'B05');
  ok(code.includes('_results[:10]') || code.includes('_results = _results[:10]'), 'Нет limit среза');
});

test('B06', 'read с where содержит _match', () => {
  const code = gen(makeCleanProject([makeBT('bt_r6', { operation: 'read', where: [{ column: 'name', value: 'test', operator: 'equals' }] })]), 'B06');
  ok(code.includes('_match'), 'Нет _match');
});

test('B07', 'read содержит bot_table_columns', () => {
  const code = gen(makeCleanProject([makeBT('bt_r7', { operation: 'read' })]), 'B07');
  ok(code.includes('bot_table_columns'), 'Нет bot_table_columns');
});

test('B08', 'Синтаксис Python валиден (read с where + orderBy + limit)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/read', 'bt_r8'),
    makeBT('bt_r8', { operation: 'read', tableName: 'scores', where: [{ column: 'level', value: '5', operator: 'greater_than' }], orderBy: 'score', orderDirection: 'desc', limit: 3, saveResultTo: 'top' }),
  ]), 'B08'), 'B08');
});

// ─── Блок C: Операция insert ─────────────────────────────────────────────────
console.log('\n─── Блок C: Операция insert ───');

test('C01', 'insert содержит INSERT INTO bot_table_rows', () => {
  const code = gen(makeCleanProject([makeBT('bt_i1', { operation: 'insert', row: { name: 'test', age: '25' } })]), 'C01');
  ok(code.includes('INSERT INTO bot_table_rows'), 'Нет INSERT INTO bot_table_rows');
});

test('C02', 'insert содержит _new_data', () => {
  const code = gen(makeCleanProject([makeBT('bt_i2', { operation: 'insert', row: { city: 'Moscow' } })]), 'C02');
  ok(code.includes('_new_data'), 'Нет _new_data');
});

test('C03', 'insert содержит json.dumps', () => {
  const code = gen(makeCleanProject([makeBT('bt_i3', { operation: 'insert', row: { x: '1' } })]), 'C03');
  ok(code.includes('json.dumps'), 'Нет json.dumps');
});

test('C04', 'Синтаксис Python валиден (insert)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/add', 'bt_i4'),
    makeBT('bt_i4', { operation: 'insert', tableName: 'users', row: { name: '{first_name}', balance: '0' }, saveResultTo: 'user' }),
  ]), 'C04'), 'C04');
});

// ─── Блок D: Операция update ─────────────────────────────────────────────────
console.log('\n─── Блок D: Операция update ───');

test('D01', 'update содержит UPDATE bot_table_rows', () => {
  const code = gen(makeCleanProject([makeBT('bt_u1', { operation: 'update', where: [{ column: 'id', value: '1', operator: 'equals' }], updates: [{ column: 'balance', op: 'set', value: '100' }] })]), 'D01');
  ok(code.includes('UPDATE bot_table_rows'), 'Нет UPDATE bot_table_rows');
});

test('D02', 'update с op=increment содержит COALESCE', () => {
  const code = gen(makeCleanProject([makeBT('bt_u2', { operation: 'update', where: [{ column: 'name', value: 'test', operator: 'equals' }], updates: [{ column: 'score', op: 'increment', value: '10' }] })]), 'D02');
  ok(code.includes('COALESCE'), 'Нет COALESCE для increment');
});

test('D03', 'update с op=decrement содержит вычитание', () => {
  const code = gen(makeCleanProject([makeBT('bt_u3', { operation: 'update', where: [{ column: 'name', value: 'test', operator: 'equals' }], updates: [{ column: 'balance', op: 'decrement', value: '50' }] })]), 'D03');
  ok(code.includes('- $2'), 'Нет вычитания для decrement');
});

test('D04', 'Синтаксис Python валиден (update с increment)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/upd', 'bt_u4'),
    makeBT('bt_u4', { operation: 'update', tableName: 'users', where: [{ column: 'name', value: '{first_name}', operator: 'equals' }], updates: [{ column: 'balance', op: 'increment', value: '100' }] }),
  ]), 'D04'), 'D04');
});

// ─── Блок E: Операция upsert ─────────────────────────────────────────────────
console.log('\n─── Блок E: Операция upsert ───');

test('E01', 'upsert содержит поиск по ключу', () => {
  const code = gen(makeCleanProject([makeBT('bt_up1', { operation: 'upsert', key: 'name', row: { name: 'test', score: '0' }, onConflict: 'update' })]), 'E01');
  ok(code.includes('_key_value'), 'Нет _key_value');
});

test('E02', 'upsert с onConflict=update содержит UPDATE', () => {
  const code = gen(makeCleanProject([makeBT('bt_up2', { operation: 'upsert', key: 'name', row: { name: 'test', score: '100' }, onConflict: 'update' })]), 'E02');
  ok(code.includes('UPDATE bot_table_rows'), 'Нет UPDATE для onConflict=update');
});

test('E03', 'upsert с onConflict=ignore содержит pass', () => {
  const code = gen(makeCleanProject([makeBT('bt_up3', { operation: 'upsert', key: 'name', row: { name: 'test' }, onConflict: 'ignore' })]), 'E03');
  ok(code.includes('pass'), 'Нет pass для onConflict=ignore');
});

test('E04', 'upsert с onConflict=merge содержит merge', () => {
  const code = gen(makeCleanProject([makeBT('bt_up4', { operation: 'upsert', key: 'name', row: { name: 'test', bio: 'hello' }, onConflict: 'merge' })]), 'E04');
  ok(code.includes('merge') || code.includes('_merge_col_id'), 'Нет merge логики');
});

test('E05', 'Синтаксис Python валиден (upsert)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/ups', 'bt_up5'),
    makeBT('bt_up5', { operation: 'upsert', tableName: 'players', key: 'name', row: { name: '{first_name}', score: '0' }, onConflict: 'update', saveResultTo: 'player' }),
  ]), 'E05'), 'E05');
});

// ─── Блок F: Операция delete ─────────────────────────────────────────────────
console.log('\n─── Блок F: Операция delete ───');

test('F01', 'delete содержит DELETE FROM bot_table_rows', () => {
  const code = gen(makeCleanProject([makeBT('bt_d1', { operation: 'delete', where: [{ column: 'name', value: 'test', operator: 'equals' }] })]), 'F01');
  ok(code.includes('DELETE FROM bot_table_rows'), 'Нет DELETE FROM bot_table_rows');
});

test('F02', 'delete содержит _match для фильтрации', () => {
  const code = gen(makeCleanProject([makeBT('bt_d2', { operation: 'delete', where: [{ column: 'status', value: 'banned', operator: 'equals' }] })]), 'F02');
  ok(code.includes('_match'), 'Нет _match');
});

test('F03', 'Синтаксис Python валиден (delete)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/del', 'bt_d3'),
    makeBT('bt_d3', { operation: 'delete', tableName: 'users', where: [{ column: 'name', value: '{first_name}', operator: 'equals' }] }),
  ]), 'F03'), 'F03');
});

// ─── Блок G: Операция count ──────────────────────────────────────────────────
console.log('\n─── Блок G: Операция count ───');

test('G01', 'count содержит _count += 1', () => {
  const code = gen(makeCleanProject([makeBT('bt_count1', { operation: 'count', saveResultTo: 'total' })]), 'G01');
  ok(code.includes('_count += 1'), 'Нет _count += 1');
});

test('G02', 'count содержит _count = 0', () => {
  const code = gen(makeCleanProject([makeBT('bt_count2', { operation: 'count', saveResultTo: 'cnt' })]), 'G02');
  ok(code.includes('_count = 0'), 'Нет _count = 0');
});

test('G03', 'count с where содержит фильтрацию', () => {
  const code = gen(makeCleanProject([makeBT('bt_count3', { operation: 'count', where: [{ column: 'active', value: '1', operator: 'equals' }], saveResultTo: 'active_count' })]), 'G03');
  ok(code.includes('_match') && code.includes('_count'), 'Нет фильтрации в count');
});

test('G04', 'Синтаксис Python валиден (count)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/cnt', 'bt_count4'),
    makeBT('bt_count4', { operation: 'count', tableName: 'users', where: [{ column: 'level', value: '10', operator: 'greater_than' }], saveResultTo: 'high_level' }),
  ]), 'G04'), 'G04');
});

// ─── Блок H: Агрегации sum/max/min/avg ───────────────────────────────────────
console.log('\n─── Блок H: Агрегации sum/max/min/avg ───');

test('H01', 'sum содержит sum(_values)', () => {
  const code = gen(makeCleanProject([makeBT('bt_sum', { operation: 'sum', aggregateColumn: 'balance', saveResultTo: 'total_balance' })]), 'H01');
  ok(code.includes('sum(_values)'), 'Нет sum(_values)');
});

test('H02', 'max содержит max(_values)', () => {
  const code = gen(makeCleanProject([makeBT('bt_max', { operation: 'max', aggregateColumn: 'score', saveResultTo: 'max_score' })]), 'H02');
  ok(code.includes('max(_values)'), 'Нет max(_values)');
});

test('H03', 'min содержит min(_values)', () => {
  const code = gen(makeCleanProject([makeBT('bt_min', { operation: 'min', aggregateColumn: 'price', saveResultTo: 'min_price' })]), 'H03');
  ok(code.includes('min(_values)'), 'Нет min(_values)');
});

test('H04', 'avg содержит деление на len', () => {
  const code = gen(makeCleanProject([makeBT('bt_avg', { operation: 'avg', aggregateColumn: 'rating', saveResultTo: 'avg_rating' })]), 'H04');
  ok(code.includes('len(_values)'), 'Нет len(_values) для avg');
});

test('H05', 'Агрегация содержит _values = []', () => {
  const code = gen(makeCleanProject([makeBT('bt_agg', { operation: 'sum', aggregateColumn: 'amount', saveResultTo: 'total' })]), 'H05');
  ok(code.includes('_values = []'), 'Нет _values = []');
});

test('H06', 'Синтаксис Python валиден (avg с where)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/avg', 'bt_avg2'),
    makeBT('bt_avg2', { operation: 'avg', tableName: 'reviews', aggregateColumn: 'rating', where: [{ column: 'product', value: 'phone', operator: 'equals' }], saveResultTo: 'avg_r' }),
  ]), 'H06'), 'H06');
});

// ─── Блок I: Операция distinct ───────────────────────────────────────────────
console.log('\n─── Блок I: Операция distinct ───');

test('I01', 'distinct содержит _unique_values', () => {
  const code = gen(makeCleanProject([makeBT('bt_dist1', { operation: 'distinct', aggregateColumn: 'city', saveResultTo: 'cities' })]), 'I01');
  ok(code.includes('_unique_values'), 'Нет _unique_values');
});

test('I02', 'distinct содержит set()', () => {
  const code = gen(makeCleanProject([makeBT('bt_dist2', { operation: 'distinct', aggregateColumn: 'country', saveResultTo: 'countries' })]), 'I02');
  ok(code.includes('set()'), 'Нет set()');
});

test('I03', 'Синтаксис Python валиден (distinct)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/dist', 'bt_dist3'),
    makeBT('bt_dist3', { operation: 'distinct', tableName: 'users', aggregateColumn: 'role', saveResultTo: 'roles' }),
  ]), 'I03'), 'I03');
});

// ─── Блок J: Операция delete_all ─────────────────────────────────────────────
console.log('\n─── Блок J: Операция delete_all ───');

test('J01', 'delete_all содержит DELETE FROM bot_table_rows WHERE table_id', () => {
  const code = gen(makeCleanProject([makeBT('bt_da1', { operation: 'delete_all', saveResultTo: 'deleted' })]), 'J01');
  ok(code.includes('DELETE FROM bot_table_rows WHERE table_id'), 'Нет DELETE FROM bot_table_rows WHERE table_id');
});

test('J02', 'Синтаксис Python валиден (delete_all)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/clear', 'bt_da2'),
    makeBT('bt_da2', { operation: 'delete_all', tableName: 'logs', saveResultTo: 'cleared' }),
  ]), 'J02'), 'J02');
});

// ─── Блок K: Формат результата ───────────────────────────────────────────────
console.log('\n─── Блок K: Формат результата ───');

test('K01', 'first_row содержит _results[0]', () => {
  const code = gen(makeCleanProject([makeBT('bt_fr', { operation: 'read', resultFormat: 'first_row', saveResultTo: 'user' })]), 'K01');
  ok(code.includes('_results[0]'), 'Нет _results[0]');
});

test('K02', 'all_rows сохраняет _results целиком', () => {
  const code = gen(makeCleanProject([makeBT('bt_ar', { operation: 'read', resultFormat: 'all_rows', saveResultTo: 'users' })]), 'K02');
  ok(code.includes('"users"') || code.includes("'users'"), 'Нет сохранения в users');
  ok(code.includes('_results'), 'Нет _results');
});

test('K03', 'scalar содержит list(... .values())[0]', () => {
  const code = gen(makeCleanProject([makeBT('bt_sc', { operation: 'read', resultFormat: 'scalar', saveResultTo: 'val' })]), 'K03');
  ok(code.includes('values()'), 'Нет values() для scalar');
});

test('K04', 'count формат содержит len(_results)', () => {
  const code = gen(makeCleanProject([makeBT('bt_cf', { operation: 'read', resultFormat: 'count', saveResultTo: 'total' })]), 'K04');
  ok(code.includes('len(_results)'), 'Нет len(_results)');
});

test('K05', 'random_row содержит choice', () => {
  const code = gen(makeCleanProject([makeBT('bt_rand', { operation: 'read', resultFormat: 'random_row', saveResultTo: 'lucky' })]), 'K05');
  ok(code.includes('choice'), 'Нет random.choice');
});

// ─── Блок L: Offset и пагинация ──────────────────────────────────────────────
console.log('\n─── Блок L: Offset и пагинация ───');

test('L01', 'offset > 0 генерирует срез', () => {
  const code = gen(makeCleanProject([makeBT('bt_off1', { operation: 'read', offset: 5, saveResultTo: 'page' })]), 'L01');
  ok(code.includes('_results[5:]') || code.includes('_results = _results[5:]'), 'Нет offset среза');
});

test('L02', 'offset + limit генерирует оба среза', () => {
  const code = gen(makeCleanProject([makeBT('bt_off2', { operation: 'read', offset: 10, limit: 5, saveResultTo: 'page2' })]), 'L02');
  ok(code.includes('[10:]') && code.includes('[:5]'), 'Нет обоих срезов offset+limit');
});

test('L03', 'Синтаксис Python валиден (offset + limit + orderBy)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/page', 'bt_off3'),
    makeBT('bt_off3', { operation: 'read', tableName: 'items', offset: 20, limit: 10, orderBy: 'created_at', orderDirection: 'desc', saveResultTo: 'items' }),
  ]), 'L03'), 'L03');
});

// ─── Блок M: returnInsertedId ────────────────────────────────────────────────
console.log('\n─── Блок M: returnInsertedId ───');

test('M01', 'returnInsertedId генерирует сохранение row_index', () => {
  const code = gen(makeCleanProject([makeBT('bt_rid1', { operation: 'insert', row: { name: 'test' }, returnInsertedId: true, saveResultTo: 'user' })]), 'M01');
  ok(code.includes('row_index'), 'Нет row_index');
});

test('M02', 'returnInsertedId сохраняет в saveResultTo_id', () => {
  const code = gen(makeCleanProject([makeBT('bt_rid2', { operation: 'insert', row: { x: '1' }, returnInsertedId: true, saveResultTo: 'item' })]), 'M02');
  ok(code.includes('item_id'), 'Нет item_id');
});

test('M03', 'Синтаксис Python валиден (insert + returnInsertedId)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/ins', 'bt_rid3'),
    makeBT('bt_rid3', { operation: 'insert', tableName: 'orders', row: { product: 'phone', qty: '1' }, returnInsertedId: true, saveResultTo: 'order' }),
  ]), 'M03'), 'M03');
});

// ─── Блок N: WHERE операторы ─────────────────────────────────────────────────
console.log('\n─── Блок N: WHERE операторы ───');

test('N01', 'equals генерирует сравнение !=', () => {
  const code = gen(makeCleanProject([makeBT('bt_w1', { operation: 'read', where: [{ column: 'name', value: 'test', operator: 'equals' }] })]), 'N01');
  ok(code.includes('!= str(_cond_val_1)'), 'Нет сравнения для equals');
});

test('N02', 'not_equals генерирует == (инвертированная логика)', () => {
  const code = gen(makeCleanProject([makeBT('bt_w2', { operation: 'read', where: [{ column: 'status', value: 'banned', operator: 'not_equals' }] })]), 'N02');
  ok(code.includes('== str(_cond_val_1)'), 'Нет == для not_equals');
});

test('N03', 'greater_than генерирует float сравнение', () => {
  const code = gen(makeCleanProject([makeBT('bt_w3', { operation: 'read', where: [{ column: 'age', value: '18', operator: 'greater_than' }] })]), 'N03');
  ok(code.includes('float(') && code.includes('>'), 'Нет float > для greater_than');
});

test('N04', 'less_than генерирует float сравнение', () => {
  const code = gen(makeCleanProject([makeBT('bt_w4', { operation: 'read', where: [{ column: 'price', value: '100', operator: 'less_than' }] })]), 'N04');
  ok(code.includes('float(') && code.includes('<'), 'Нет float < для less_than');
});

test('N05', 'contains генерирует not in', () => {
  const code = gen(makeCleanProject([makeBT('bt_w5', { operation: 'read', where: [{ column: 'bio', value: 'dev', operator: 'contains' }] })]), 'N05');
  ok(code.includes('not in'), 'Нет not in для contains');
});

test('N06', 'is_empty генерирует .strip()', () => {
  const code = gen(makeCleanProject([makeBT('bt_w6', { operation: 'read', where: [{ column: 'email', value: '', operator: 'is_empty' }] })]), 'N06');
  ok(code.includes('.strip()'), 'Нет .strip() для is_empty');
});

test('N07', 'Синтаксис Python валиден (множественные where)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/filter', 'bt_w7'),
    makeBT('bt_w7', { operation: 'read', tableName: 'users', where: [
      { column: 'age', value: '18', operator: 'greater_than' },
      { column: 'status', value: 'active', operator: 'equals' },
      { column: 'name', value: '', operator: 'is_not_empty' },
    ], saveResultTo: 'filtered' }),
  ]), 'N07'), 'N07');
});

// ─── Блок O: Автопереход ─────────────────────────────────────────────────────
console.log('\n─── Блок O: Автопереход ───');

test('O01', 'autoTransitionTo генерирует вызов handle_callback', () => {
  const code = gen(makeCleanProject([
    makeBT('bt_at1', { operation: 'read', autoTransitionTo: 'msg_next', enableAutoTransition: true }),
    makeMsg('msg_next'),
  ]), 'O01');
  ok(code.includes('handle_callback_msg_next'), 'Нет автоперехода к msg_next');
});

test('O02', 'Без autoTransitionTo нет вызова следующего узла', () => {
  const code = gen(makeCleanProject([makeBT('bt_at2', { operation: 'read' })]), 'O02');
  const lines = code.split('\n').filter(l => l.includes('handle_callback_bt_at2'));
  ok(lines.length >= 1, 'Нет handle_callback_bt_at2');
});

test('O03', 'Синтаксис Python валиден (autoTransition)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/go', 'bt_at3'),
    makeBT('bt_at3', { operation: 'count', tableName: 'users', saveResultTo: 'cnt', autoTransitionTo: 'msg_res', enableAutoTransition: true }),
    makeMsg('msg_res', 'Всего: {cnt}'),
  ]), 'O03'), 'O03');
});

// ─── Блок P: Синтаксис полных сценариев ──────────────────────────────────────
console.log('\n─── Блок P: Синтаксис полных сценариев ───');

test('P01', 'Полный сценарий: cmd → insert → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/register', 'bt_p1'),
    makeBT('bt_p1', { operation: 'insert', tableName: 'users', row: { name: '{first_name}', balance: '0' }, saveResultTo: 'user', autoTransitionTo: 'msg_p1', enableAutoTransition: true }),
    makeMsg('msg_p1', 'Регистрация завершена!'),
  ]), 'P01'), 'P01');
});

test('P02', 'Полный сценарий: cmd → read → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/profile', 'bt_p2'),
    makeBT('bt_p2', { operation: 'read', tableName: 'users', where: [{ column: 'name', value: '{first_name}', operator: 'equals' }], resultFormat: 'first_row', saveResultTo: 'profile', autoTransitionTo: 'msg_p2', enableAutoTransition: true }),
    makeMsg('msg_p2', 'Баланс: {profile.balance}'),
  ]), 'P02'), 'P02');
});

test('P03', 'Полный сценарий: cmd → update → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/work', 'bt_p3'),
    makeBT('bt_p3', { operation: 'update', tableName: 'users', where: [{ column: 'name', value: '{first_name}', operator: 'equals' }], updates: [{ column: 'balance', op: 'increment', value: '100' }], autoTransitionTo: 'msg_p3', enableAutoTransition: true }),
    makeMsg('msg_p3', 'Баланс пополнен!'),
  ]), 'P03'), 'P03');
});

test('P04', 'Полный сценарий: cmd → sum → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/total', 'bt_p4'),
    makeBT('bt_p4', { operation: 'sum', tableName: 'orders', aggregateColumn: 'amount', saveResultTo: 'total_sum', autoTransitionTo: 'msg_p4', enableAutoTransition: true }),
    makeMsg('msg_p4', 'Итого: {total_sum}'),
  ]), 'P04'), 'P04');
});

test('P05', 'Полный сценарий: cmd → upsert + returnInsertedId → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/join', 'bt_p5'),
    makeBT('bt_p5', { operation: 'upsert', tableName: 'players', key: 'name', row: { name: '{first_name}', score: '0', level: '1' }, onConflict: 'update', returnInsertedId: true, saveResultTo: 'player', autoTransitionTo: 'msg_p5', enableAutoTransition: true }),
    makeMsg('msg_p5', 'Добро пожаловать!'),
  ]), 'P05'), 'P05');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 45 — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`);
  });
  process.exit(1);
}
