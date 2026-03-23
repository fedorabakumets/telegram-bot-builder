/**
 * @fileoverview Фаза 4 — Узел condition (ветвление потока)
 *
 * Блок A: Базовая генерация
 * Блок B: Оператор filled
 * Блок C: Оператор empty
 * Блок D: Оператор equals
 * Блок E: Оператор else
 * Блок F: Комбинации веток
 * Блок G: Переменная
 * Блок H: Несколько узлов condition
 * Блок I: Целевые узлы (target)
 * Блок J: Интеграция с другими узлами
 * Блок K: Граничные случаи
 * Блок L: Структура Python кода
 * Блок M: Производительность
 * Блок N: Отсутствие лишнего кода
 * Блок O: Оператор contains
 * Блок P: Оператор greater_than
 * Блок Q: Оператор less_than
 * Блок R: Оператор between
 * Блок S: Числовые операторы — граничные случаи
 * Блок T: Системные операторы (is_private, is_group, is_channel)
 * Блок U: Операторы is_admin, is_premium, is_bot
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
  return generatePythonCode(project as any, { botName: `Phase4_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p4_${label}.py`;
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

function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: { variable, branches },
  };
}

function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

function makeStartNode(id = 'start1') {
  return {
    id,
    type: 'start',
    position: { x: 0, y: -200 },
    data: { command: '/start', messageText: 'Старт', keyboardType: 'none', buttons: [] },
  };
}

function makeBranch(operator: string, value = '', target?: string) {
  return { id: `br_${operator}_${Math.random().toString(36).slice(2, 6)}`, label: operator, operator, value, target };
}

function makeBranchBetween(value: string, value2: string, target?: string) {
  return { id: `br_between_${Math.random().toString(36).slice(2, 6)}`, label: 'between', operator: 'between', value, value2, target };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 4 — Узел condition (ветвление потока)                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'condition с variable + ветка filled → генерируется async def handle_callback_<nodeId>', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a01');
  ok(code.includes('async def handle_callback_cond1'), 'async def handle_callback_cond1 должен быть в коде');
});

test('A02', 'содержит _all_vars = await init_all_user_vars(user_id)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a02');
  ok(code.includes('_all_vars = await init_all_user_vars(user_id)'), '_all_vars = await init_all_user_vars(user_id) должен быть в коде');
});

test('A03', 'содержит logging.info(', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a03');
  ok(code.includes('logging.info('), 'logging.info( должен быть в коде');
});

test('A04', 'содержит user_id = callback_query.from_user.id', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a04');
  ok(code.includes('user_id = callback_query.from_user.id'), 'user_id = callback_query.from_user.id должен быть в коде');
});

test('A05', 'ветка filled → if val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a05');
  ok(code.includes('if val:'), 'if val: должен быть в коде');
});

test('A06', 'ветка else → else:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled'), makeBranch('else')])]);
  const code = gen(p, 'a06');
  ok(code.includes('else:'), 'else: должен быть в коде');
});

test('A07', 'ветка с target → await handle_callback_<target>(callback_query)', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'user_name', [makeBranch('filled', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a07');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1(callback_query) должен быть в коде');
});

test('A08', 'ветка без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a08');
  ok(code.includes('pass'), 'pass должен быть в коде для ветки без target');
});

test('A09', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled'), makeBranch('else')])]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'без variable → узел игнорируется (нет handle_callback_cond1)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('filled')])]);
  const code = gen(p, 'a10');
  ok(!code.includes('handle_callback_cond1'), 'handle_callback_cond1 НЕ должен быть без variable');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Оператор filled
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Оператор filled ───────────────────────────────────────');

test('B01', 'filled → if val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'b01');
  ok(code.includes('if val:'), 'if val: должен быть в коде');
});

test('B02', 'filled + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b02');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
});

test('B03', 'filled без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'b03');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('B04', 'filled как первая ветка → if val: (не elif)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'b04');
  ok(code.includes('if val:'), 'if val: должен быть в коде');
  ok(!code.includes('elif val:'), 'elif val: НЕ должен быть для первой ветки');
});

test('B05', 'filled как вторая ветка → elif val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty'), makeBranch('filled')])]);
  const code = gen(p, 'b05');
  ok(code.includes('elif val:'), 'elif val: должен быть для второй ветки filled');
});

test('B06', 'filled → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'filled + variable с пробелами → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user name', [makeBranch('filled')])]);
  syntax(gen(p, 'b07'), 'b07');
});

test('B08', 'несколько filled веток → корректный if/elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('filled')])]);
  const code = gen(p, 'b08');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif val:'), 'elif val: должен быть для второй filled ветки');
  syntax(code, 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Оператор empty
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Оператор empty ────────────────────────────────────────');

test('C01', 'empty → not val', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty')])]);
  const code = gen(p, 'c01');
  ok(code.includes('not val'), 'not val должен быть в коде');
});

test('C02', 'empty как первая ветка → if not val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty')])]);
  const code = gen(p, 'c02');
  ok(code.includes('if not val:'), 'if not val: должен быть в коде');
});

test('C03', 'empty как вторая ветка → elif not val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('empty')])]);
  const code = gen(p, 'c03');
  ok(code.includes('elif not val:'), 'elif not val: должен быть в коде');
});

test('C04', 'empty + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('empty', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c04');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
});

test('C05', 'empty без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty')])]);
  const code = gen(p, 'c05');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('C06', 'empty → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty')])]);
  syntax(gen(p, 'c06'), 'c06');
});

test('C07', 'filled + empty → if val: ... elif not val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('empty')])]);
  const code = gen(p, 'c07');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif not val:'), 'elif not val: должен быть');
  const ifIdx = code.indexOf('if val:');
  const elifIdx = code.indexOf('elif not val:');
  ok(ifIdx < elifIdx, 'if val: должен идти перед elif not val:');
});

test('C08', 'empty + filled → if not val: ... elif val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty'), makeBranch('filled')])]);
  const code = gen(p, 'c08');
  ok(code.includes('if not val:'), 'if not val: должен быть');
  ok(code.includes('elif val:'), 'elif val: должен быть');
  const ifIdx = code.indexOf('if not val:');
  const elifIdx = code.indexOf('elif val:');
  ok(ifIdx < elifIdx, 'if not val: должен идти перед elif val:');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Оператор equals
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Оператор equals ───────────────────────────────────────');

test('D01', 'equals → val == "<value>"', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'да')])]);
  const code = gen(p, 'd01');
  ok(code.includes('val == "да"'), 'val == "да" должен быть в коде');
});

test('D02', 'equals как первая ветка → if val == "<value>":', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'да')])]);
  const code = gen(p, 'd02');
  ok(code.includes('if val == "да":'), 'if val == "да": должен быть в коде');
});

test('D03', 'equals как вторая ветка → elif val == "<value>":', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('equals', 'да')])]);
  const code = gen(p, 'd03');
  ok(code.includes('elif val == "да":'), 'elif val == "да": должен быть в коде');
});

test('D04', 'equals + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('equals', 'да', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd04');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
});

test('D05', 'equals без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'да')])]);
  const code = gen(p, 'd05');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('D06', 'equals с пустым value → val == ""', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', '')])]);
  const code = gen(p, 'd06');
  ok(code.includes('val == ""'), 'val == "" должен быть в коде');
});

test('D07', 'equals с числом → val == "42"', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', '42')])]);
  const code = gen(p, 'd07');
  ok(code.includes('val == "42"'), 'val == "42" должен быть в коде');
});

test('D08', 'несколько equals → несколько elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('equals', 'да'),
    makeBranch('equals', 'нет'),
    makeBranch('equals', 'может'),
  ])]);
  const code = gen(p, 'd08');
  ok(code.includes('if val == "да":'), 'if val == "да": должен быть');
  ok(code.includes('elif val == "нет":'), 'elif val == "нет": должен быть');
  ok(code.includes('elif val == "может":'), 'elif val == "может": должен быть');
  syntax(code, 'd08');
});

test('D09', 'equals → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'тест')])]);
  syntax(gen(p, 'd09'), 'd09');
});

test('D10', 'equals + value с кириллицей → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'Привет мир')])]);
  syntax(gen(p, 'd10'), 'd10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Оператор else
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Оператор else ─────────────────────────────────────────');

test('E01', 'else → else:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')])]);
  const code = gen(p, 'e01');
  ok(code.includes('else:'), 'else: должен быть в коде');
});

test('E02', 'else + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e02');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
});

test('E03', 'else без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')])]);
  const code = gen(p, 'e03');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('E04', 'else всегда последний → else: идёт после всех if/elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('equals', 'да'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'e04');
  const ifIdx = code.indexOf('if val:');
  const elifIdx = code.indexOf('elif val == "да":');
  const elseIdx = code.indexOf('else:');
  ok(ifIdx < elifIdx, 'if должен идти перед elif');
  ok(elifIdx < elseIdx, 'elif должен идти перед else');
});

test('E05', 'filled + else → if val: ... else:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')])]);
  const code = gen(p, 'e05');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'e05');
});

test('E06', 'empty + else → if not val: ... else:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('empty'), makeBranch('else')])]);
  const code = gen(p, 'e06');
  ok(code.includes('if not val:'), 'if not val: должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'e06');
});

test('E07', 'equals + else → if val == "...": ... else:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'да'), makeBranch('else')])]);
  const code = gen(p, 'e07');
  ok(code.includes('if val == "да":'), 'if val == "да": должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'e07');
});

test('E08', 'else → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')])]);
  syntax(gen(p, 'e08'), 'e08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Комбинации веток
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Комбинации веток ──────────────────────────────────────');

test('F01', 'filled + empty + else → полная цепочка if/elif/else', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('empty'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'f01');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif not val:'), 'elif not val: должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'f01');
});

test('F02', 'filled + equals + else → корректная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('equals', 'да'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'f02');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif val == "да":'), 'elif val == "да": должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'f02');
});

test('F03', 'empty + equals + else → корректная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('empty'),
    makeBranch('equals', 'нет'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'f03');
  ok(code.includes('if not val:'), 'if not val: должен быть');
  ok(code.includes('elif val == "нет":'), 'elif val == "нет": должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'f03');
});

test('F04', 'filled + equals("да") + equals("нет") + else → 4 ветки', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('equals', 'да'),
    makeBranch('equals', 'нет'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'f04');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif val == "да":'), 'elif val == "да": должен быть');
  ok(code.includes('elif val == "нет":'), 'elif val == "нет": должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'f04');
});

test('F05', 'только else → else: без if', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('else')])]);
  const code = gen(p, 'f05');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'f05');
});

test('F06', 'только filled → только if val: без else', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'f06');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(!code.includes('else:'), 'else: НЕ должен быть');
});

test('F07', 'filled + empty (без else) → if val: ... elif not val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('empty')])]);
  const code = gen(p, 'f07');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif not val:'), 'elif not val: должен быть');
  ok(!code.includes('else:'), 'else: НЕ должен быть');
  syntax(code, 'f07');
});

test('F08', '5 веток → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('equals', 'a'),
    makeBranch('equals', 'b'),
    makeBranch('equals', 'c'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 'f08'), 'f08');
});

test('F09', 'все 4 оператора → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('empty'),
    makeBranch('equals', 'test'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 'f09'), 'f09');
});

test('F10', 'порядок веток сохраняется', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('equals', 'первый'),
    makeBranch('equals', 'второй'),
    makeBranch('equals', 'третий'),
  ])]);
  const code = gen(p, 'f10');
  const idx1 = code.indexOf('"первый"');
  const idx2 = code.indexOf('"второй"');
  const idx3 = code.indexOf('"третий"');
  ok(idx1 < idx2, '"первый" должен идти перед "второй"');
  ok(idx2 < idx3, '"второй" должен идти перед "третий"');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Переменная
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Переменная ────────────────────────────────────────────');

test('G01', 'variable = "user_name" → _all_vars.get("user_name")', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'g01');
  ok(code.includes('_all_vars.get("user_name"'), '_all_vars.get("user_name" должен быть в коде');
});

test('G02', 'variable = "age" → _all_vars.get("age")', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('filled')])]);
  const code = gen(p, 'g02');
  ok(code.includes('_all_vars.get("age"'), '_all_vars.get("age" должен быть в коде');
});

test('G03', 'variable с пробелами → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user name', [makeBranch('filled')])]);
  syntax(gen(p, 'g03'), 'g03');
});

test('G04', 'variable пустая → узел игнорируется', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('filled')])]);
  const code = gen(p, 'g04');
  ok(!code.includes('handle_callback_cond1'), 'handle_callback_cond1 НЕ должен быть при пустой variable');
});

test('G05', 'variable только пробелы → узел игнорируется', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '   ', [makeBranch('filled')])]);
  const code = gen(p, 'g05');
  ok(!code.includes('handle_callback_cond1'), 'handle_callback_cond1 НЕ должен быть при variable из пробелов');
});

test('G06', 'variable с цифрами → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'var123', [makeBranch('filled')])]);
  syntax(gen(p, 'g06'), 'g06');
});

test('G07', 'variable с Unicode → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'имя_пользователя', [makeBranch('filled')])]);
  syntax(gen(p, 'g07'), 'g07');
});

test('G08', 'variable в logging.info → переменная упоминается в логе', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'my_var', [makeBranch('filled')])]);
  const code = gen(p, 'g08');
  ok(code.includes('my_var'), 'my_var должен упоминаться в коде (в logging.info)');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Несколько узлов condition
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Несколько узлов condition ────────────────────────────');

test('H01', 'два condition → два handle_callback_', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'h01');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть');
  ok(code.includes('handle_callback_cond2'), 'handle_callback_cond2 должен быть');
});

test('H02', 'три condition → три обработчика', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled')]),
    makeConditionNode('cond3', 'z', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'h02');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть');
  ok(code.includes('handle_callback_cond2'), 'handle_callback_cond2 должен быть');
  ok(code.includes('handle_callback_cond3'), 'handle_callback_cond3 должен быть');
});

test('H03', 'condition + message → оба в коде', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h03');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть');
});

test('H04', 'start + condition + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h04'), 'h04');
});

test('H05', 'два condition с разными переменными → обе переменные в коде', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'var_a', [makeBranch('filled')]),
    makeConditionNode('cond2', 'var_b', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'h05');
  ok(code.includes('"var_a"'), '"var_a" должен быть в коде');
  ok(code.includes('"var_b"'), '"var_b" должен быть в коде');
});

test('H06', 'два condition, один без variable → только один генерируется', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled')]),
    makeConditionNode('cond2', '', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'h06');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть');
  ok(!code.includes('handle_callback_cond2'), 'handle_callback_cond2 НЕ должен быть без variable');
});

test('H07', 'два condition, один без веток → только один генерируется', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled')]),
    makeConditionNode('cond2', 'y', []),
  ]);
  const code = gen(p, 'h07');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть');
  ok(!code.includes('handle_callback_cond2'), 'handle_callback_cond2 НЕ должен быть без веток');
});

test('H08', '5 condition узлов → синтаксис OK', () => {
  const nodes = Array.from({ length: 5 }, (_, i) =>
    makeConditionNode(`cond${i + 1}`, `var${i + 1}`, [makeBranch('filled'), makeBranch('else')])
  );
  syntax(gen(makeCleanProject(nodes), 'h08'), 'h08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Целевые узлы (target)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Целевые узлы (target) ────────────────────────────────');

test('I01', 'target = message узел → await handle_callback_<msgId>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i01');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
});

test('I02', 'target = другой condition → await handle_callback_<condId>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'cond2')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'i02');
  ok(code.includes('await handle_callback_cond2(callback_query)'), 'await handle_callback_cond2 должен быть в коде');
});

test('I03', 'target отсутствует (undefined) → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [{ id: 'br1', label: 'filled', operator: 'filled', value: '' }])]);
  const code = gen(p, 'i03');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('I04', 'target = "" → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled', '', '')])]);
  const code = gen(p, 'i04');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('I05', 'разные ветки → разные target', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [
      makeBranch('filled', '', 'msg1'),
      makeBranch('else', '', 'msg2'),
    ]),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'i05');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть');
  ok(code.includes('await handle_callback_msg2(callback_query)'), 'await handle_callback_msg2 должен быть');
});

test('I06', 'все ветки с target → все await handle_callback_', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [
      makeBranch('filled', '', 'msg1'),
      makeBranch('empty', '', 'msg2'),
      makeBranch('else', '', 'msg3'),
    ]),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
    makeMessageNode('msg3'),
  ]);
  const code = gen(p, 'i06');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть');
  ok(code.includes('await handle_callback_msg2(callback_query)'), 'await handle_callback_msg2 должен быть');
  ok(code.includes('await handle_callback_msg3(callback_query)'), 'await handle_callback_msg3 должен быть');
});

test('I07', 'target с дефисом в ID → safe_name корректно обрабатывает', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg-with-dashes')]),
    makeMessageNode('msg-with-dashes'),
  ]);
  const code = gen(p, 'i07');
  // safe_name заменяет дефисы на подчёркивания
  ok(code.includes('handle_callback_msg_with_dashes'), 'handle_callback_msg_with_dashes должен быть в коде');
  syntax(code, 'i07');
});

test('I08', 'синтаксис OK при всех вариантах target', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [
      makeBranch('filled', '', 'msg1'),
      makeBranch('empty', '', ''),
      makeBranch('else'),
    ]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'i08'), 'i08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Интеграция с другими узлами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Интеграция с другими узлами ──────────────────────────');

test('J01', 'start → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'j01'), 'j01');
});

test('J02', 'start → condition (filled→msg1, else→msg2) → оба message в коде', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'x', [
      makeBranch('filled', '', 'msg1'),
      makeBranch('else', '', 'msg2'),
    ]),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'j02');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть');
  ok(code.includes('handle_callback_msg2'), 'handle_callback_msg2 должен быть');
  syntax(code, 'j02');
});

test('J03', 'start → condition → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'cond2'), makeBranch('else')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'j03'), 'j03');
});

test('J04', 'command_trigger → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    {
      id: 'cmd1', type: 'command_trigger', position: { x: 0, y: 0 },
      data: { command: '/check', messageText: '', keyboardType: 'none', buttons: [], autoTransitionTo: 'cond1' },
    },
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'j04'), 'j04');
});

test('J05', 'text_trigger → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    {
      id: 'tt1', type: 'text_trigger', position: { x: 0, y: 0 },
      data: { textSynonyms: ['привет'], textMatchType: 'exact', adminOnly: false, requiresAuth: false, autoTransitionTo: 'cond1', buttons: [], keyboardType: 'none' },
    },
    makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'j05'), 'j05');
});

test('J06', 'condition в середине цепочки → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'step', [
      makeBranch('equals', '1', 'msg1'),
      makeBranch('equals', '2', 'msg2'),
      makeBranch('else', '', 'msg3'),
    ]),
    makeMessageNode('msg1', 'Шаг 1'),
    makeMessageNode('msg2', 'Шаг 2'),
    makeMessageNode('msg3', 'Другой шаг'),
  ]);
  syntax(gen(p, 'j06'), 'j06');
});

test('J07', 'несколько start → несколько condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeStartNode('start2'),
    makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled'), makeBranch('else')]),
  ]);
  syntax(gen(p, 'j07'), 'j07');
});

test('J08', 'полный граф с condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'user_name', [
      makeBranch('filled', '', 'msg_welcome'),
      makeBranch('empty', '', 'msg_ask'),
      makeBranch('else', '', 'msg_default'),
    ]),
    makeMessageNode('msg_welcome', 'Добро пожаловать!'),
    makeMessageNode('msg_ask', 'Как вас зовут?'),
    makeMessageNode('msg_default', 'Привет!'),
  ]);
  syntax(gen(p, 'j08'), 'j08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Граничные случаи ──────────────────────────────────────');

test('K01', 'пустой массив branches → узел игнорируется', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [])]);
  const code = gen(p, 'k01');
  ok(!code.includes('handle_callback_cond1'), 'handle_callback_cond1 НЕ должен быть при пустых ветках');
});

test('K02', 'branches = null → узел игнорируется', () => {
  const node = { id: 'cond1', type: 'condition', position: { x: 0, y: 0 }, data: { variable: 'x', branches: null } };
  const p = makeCleanProject([node]);
  const code = gen(p, 'k02');
  ok(!code.includes('handle_callback_cond1'), 'handle_callback_cond1 НЕ должен быть при branches=null');
});

test('K03', 'ветка без id → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    { label: 'filled', operator: 'filled', value: '' },
  ])]);
  syntax(gen(p, 'k03'), 'k03');
});

test('K04', 'ветка без operator → синтаксис OK (или игнорируется)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    { id: 'br1', label: 'unknown', operator: undefined, value: '' },
    makeBranch('else'),
  ])]);
  // Генератор должен либо игнорировать ветку, либо генерировать корректный код
  const code = gen(p, 'k04');
  syntax(code, 'k04');
});

test('K05', 'очень длинная variable → синтаксис OK', () => {
  const longVar = 'a'.repeat(200);
  const p = makeCleanProject([makeConditionNode('cond1', longVar, [makeBranch('filled')])]);
  syntax(gen(p, 'k05'), 'k05');
});

test('K06', 'очень длинное value в equals → синтаксис OK', () => {
  const longVal = 'x'.repeat(500);
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', longVal)])]);
  syntax(gen(p, 'k06'), 'k06');
});

test('K07', 'value с кавычками → синтаксис OK (экранирование)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'say "hello"')])]);
  syntax(gen(p, 'k07'), 'k07');
});

test('K08', 'value с переносом строки → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('equals', 'line1\nline2')])]);
  syntax(gen(p, 'k08'), 'k08');
});

test('K09', 'nodeId с дефисами → safe_name корректно обрабатывает', () => {
  const p = makeCleanProject([makeConditionNode('cond-node-1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'k09');
  ok(code.includes('handle_callback_cond_node_1'), 'handle_callback_cond_node_1 должен быть в коде');
  syntax(code, 'k09');
});

test('K10', 'nodeId с цифрами в начале → safe_name корректно обрабатывает', () => {
  const p = makeCleanProject([makeConditionNode('123cond', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'k10');
  // safe_name должен сделать имя валидным Python идентификатором
  syntax(code, 'k10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Структура Python кода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Структура Python кода ────────────────────────────────');

test('L01', 'функция начинается с async def handle_callback_', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l01');
  ok(code.includes('async def handle_callback_cond1'), 'async def handle_callback_cond1 должен быть в коде');
});

test('L02', 'тело функции содержит user_id = callback_query.from_user.id', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l02');
  ok(code.includes('user_id = callback_query.from_user.id'), 'user_id = callback_query.from_user.id должен быть в теле функции');
});

test('L03', 'тело функции содержит val = _all_vars.get(', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l03');
  ok(code.includes('val = _all_vars.get('), 'val = _all_vars.get( должен быть в теле функции');
});

test('L04', 'тело функции содержит logging.info(', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l04');
  ok(code.includes('logging.info('), 'logging.info( должен быть в теле функции');
});

test('L05', 'ветки идут после logging.info', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l05');
  const loggingIdx = code.indexOf('logging.info(');
  const ifIdx = code.indexOf('if val:');
  ok(loggingIdx < ifIdx, 'logging.info должен идти перед if val:');
});

test('L06', 'нет лишних handle_callback_ для condition (только один def)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l06');
  const defs = (code.match(/async def handle_callback_cond1/g) || []).length;
  ok(defs === 1, `Должен быть ровно 1 def handle_callback_cond1, найдено: ${defs}`);
});

test('L07', 'нет @dp.message декоратора у condition', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l07');
  // Ищем @dp.message непосредственно перед handle_callback_cond1
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const before = code.substring(Math.max(0, condIdx - 200), condIdx);
  ok(!before.includes('@dp.message'), '@dp.message НЕ должен быть перед handle_callback_cond1');
});

test('L08', 'нет @dp.callback_query декоратора у condition', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l08');
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const before = code.substring(Math.max(0, condIdx - 200), condIdx);
  ok(!before.includes('@dp.callback_query'), '@dp.callback_query НЕ должен быть перед handle_callback_cond1');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Производительность ────────────────────────────────────');

test('M01', '10 condition узлов → синтаксис OK, время < 5 сек', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeConditionNode(`cond${i + 1}`, `var${i + 1}`, [makeBranch('filled'), makeBranch('else')])
  );
  const start = Date.now();
  const code = gen(makeCleanProject(nodes), 'm01');
  const elapsed = Date.now() - start;
  ok(elapsed < 5000, `Генерация заняла ${elapsed}мс, должна быть < 5000мс`);
  syntax(code, 'm01');
});

test('M02', 'condition с 10 ветками → синтаксис OK', () => {
  const branches = Array.from({ length: 9 }, (_, i) => makeBranch('equals', `val${i}`));
  branches.push(makeBranch('else'));
  const p = makeCleanProject([makeConditionNode('cond1', 'x', branches)]);
  syntax(gen(p, 'm02'), 'm02');
});

test('M03', 'condition с 20 ветками → синтаксис OK', () => {
  const branches = Array.from({ length: 19 }, (_, i) => makeBranch('equals', `value_${i}`));
  branches.push(makeBranch('else'));
  const p = makeCleanProject([makeConditionNode('cond1', 'x', branches)]);
  syntax(gen(p, 'm03'), 'm03');
});

test('M04', '50 condition узлов → синтаксис OK', () => {
  const nodes = Array.from({ length: 50 }, (_, i) =>
    makeConditionNode(`cond${i + 1}`, `var${i + 1}`, [makeBranch('filled'), makeBranch('else')])
  );
  syntax(gen(makeCleanProject(nodes), 'm04'), 'm04');
});

test('M05', 'condition + 50 message узлов → синтаксис OK', () => {
  const messages = Array.from({ length: 50 }, (_, i) => makeMessageNode(`msg${i + 1}`, `Ответ ${i + 1}`));
  const cond = makeConditionNode('cond1', 'x', [makeBranch('filled', '', 'msg1'), makeBranch('else', '', 'msg2')]);
  syntax(gen(makeCleanProject([cond, ...messages]), 'm05'), 'm05');
});

test('M06', 'большой граф (100 узлов) → синтаксис OK', () => {
  const conditions = Array.from({ length: 50 }, (_, i) =>
    makeConditionNode(`cond${i + 1}`, `var${i + 1}`, [makeBranch('filled'), makeBranch('else')])
  );
  const messages = Array.from({ length: 50 }, (_, i) => makeMessageNode(`msg${i + 1}`, `Ответ ${i + 1}`));
  syntax(gen(makeCleanProject([...conditions, ...messages]), 'm06'), 'm06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Отсутствие лишнего кода ──────────────────────────────');

test('N01', 'без condition узлов → нет get_user_variable в обработчиках condition', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'n01');
  // get_user_variable может быть в utils, но не должно быть в обработчиках condition
  ok(!code.includes('handle_callback_cond'), 'handle_callback_cond НЕ должен быть без condition узлов');
});

test('N02', 'без condition узлов → нет handle_callback_ для condition', () => {
  const p = makeCleanProject([makeStartNode()]);
  const code = gen(p, 'n02');
  // Не должно быть ни одного handle_callback_ для condition (только для start/message)
  ok(!code.includes('Узел условия'), 'Узел условия НЕ должен быть без condition узлов');
});

test('N03', 'condition без target → нет лишних await handle_callback_ в ветках', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('else')])]);
  const code = gen(p, 'n03');
  // Все ветки без target → только pass, нет await handle_callback_
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const nextDefIdx = code.indexOf('async def ', condIdx + 1);
  const funcBody = nextDefIdx > 0 ? code.substring(condIdx, nextDefIdx) : code.substring(condIdx);
  ok(!funcBody.includes('await handle_callback_'), 'await handle_callback_ НЕ должен быть в ветках без target');
});

test('N04', 'один condition → ровно один handle_callback_ для него', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'n04');
  const count = (code.match(/async def handle_callback_cond1/g) || []).length;
  ok(count === 1, `Должен быть ровно 1 def handle_callback_cond1, найдено: ${count}`);
});

test('N05', 'нет @dp.message у condition обработчиков', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'n05');
  // Ищем @dp.message непосредственно перед handle_callback_cond1
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const before = code.substring(Math.max(0, condIdx - 300), condIdx);
  ok(!before.includes('@dp.message'), '@dp.message НЕ должен быть перед condition обработчиком');
});

test('N06', 'нет @dp.callback_query у condition обработчиков', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'n06');
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const before = code.substring(Math.max(0, condIdx - 300), condIdx);
  ok(!before.includes('@dp.callback_query'), '@dp.callback_query НЕ должен быть перед condition обработчиком');
});

test('N07', 'нет дублирования функций', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('filled')]),
    makeConditionNode('cond2', 'y', [makeBranch('filled')]),
  ]);
  const code = gen(p, 'n07');
  const defs1 = (code.match(/async def handle_callback_cond1/g) || []).length;
  const defs2 = (code.match(/async def handle_callback_cond2/g) || []).length;
  ok(defs1 === 1, `handle_callback_cond1 должен быть ровно 1 раз, найдено: ${defs1}`);
  ok(defs2 === 1, `handle_callback_cond2 должен быть ровно 1 раз, найдено: ${defs2}`);
});

test('N08', 'синтаксис всего файла OK при любом наборе узлов', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'status', [
      makeBranch('filled', '', 'msg1'),
      makeBranch('empty', '', 'msg2'),
      makeBranch('equals', 'active', 'msg3'),
      makeBranch('else', '', 'msg4'),
    ]),
    makeMessageNode('msg1', 'Заполнено'),
    makeMessageNode('msg2', 'Пусто'),
    makeMessageNode('msg3', 'Активен'),
    makeMessageNode('msg4', 'Другое'),
  ]);
  syntax(gen(p, 'n08'), 'n08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК O: Оператор contains
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок O: Оператор contains ─────────────────────────────────────');

test('O01', 'contains с совпадением подстроки → переход по ветке', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('contains', 'привет', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'o01');
  ok(code.includes('"привет" in val'), '"привет" in val должен быть в коде');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
  syntax(code, 'o01');
});

test('O02', 'contains без совпадения → переход в else', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('contains', 'нет_такого'), makeBranch('else', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'o02');
  ok(code.includes('"нет_такого" in val'), '"нет_такого" in val должен быть в коде');
  ok(code.includes('else:'), 'else: должен быть в коде');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в else-ветке');
  syntax(code, 'o02');
});

test('O03', 'contains с пустой переменной → переход в else', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('contains', 'текст'), makeBranch('else', '', 'msg1')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'o03');
  // val будет "" → "текст" in "" → False → else
  ok(code.includes('"текст" in val'), '"текст" in val должен быть в коде');
  ok(code.includes('else:'), 'else: должен быть в коде');
  syntax(code, 'o03');
});

test('O04', 'contains с пустым значением поиска → всегда true (пустая строка есть в любой строке)', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'x', [makeBranch('contains', '', 'msg1'), makeBranch('else')]),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'o04');
  // "" in val → всегда True в Python
  ok(code.includes('"" in val'), '"" in val должен быть в коде');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
  syntax(code, 'o04');
});

test('O05', 'contains как первая ветка → if "..." in val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('contains', 'test')])]);
  const code = gen(p, 'o05');
  ok(code.includes('if "test" in val:'), 'if "test" in val: должен быть в коде');
  ok(!code.includes('elif "test" in val:'), 'elif НЕ должен быть для первой ветки');
});

test('O06', 'contains как вторая ветка → elif "..." in val:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled'), makeBranch('contains', 'test')])]);
  const code = gen(p, 'o06');
  ok(code.includes('elif "test" in val:'), 'elif "test" in val: должен быть для второй ветки');
});

test('O07', 'contains → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('contains', 'подстрока'), makeBranch('else')])]);
  syntax(gen(p, 'o07'), 'o07');
});

test('O08', 'filled + contains + else → корректная цепочка if/elif/else', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('contains', 'да'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'o08');
  ok(code.includes('if val:'), 'if val: должен быть');
  ok(code.includes('elif "да" in val:'), 'elif "да" in val: должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'o08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК P: Оператор greater_than
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок P: Оператор greater_than ─────────────────────────────────');

test('P01', 'greater_than → генерируется _num_val > N', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18')])]);
  const code = gen(p, 'p01');
  ok(code.includes('_num_val > 18'), '_num_val > 18 должен быть в коде');
});

test('P02', 'greater_than как первая ветка → if _num_val is not None and _num_val > N:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18')])]);
  const code = gen(p, 'p02');
  ok(code.includes('if _num_val is not None and _num_val > 18:'), 'if _num_val is not None and _num_val > 18: должен быть в коде');
});

test('P03', 'greater_than как вторая ветка → elif _num_val is not None and _num_val > N:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranch('greater_than', '65'),
    makeBranch('greater_than', '18'),
  ])]);
  const code = gen(p, 'p03');
  ok(code.includes('elif _num_val is not None and _num_val > 18:'), 'elif _num_val is not None and _num_val > 18: должен быть в коде');
});

test('P04', 'greater_than + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18', 'msg_adult')]),
    makeMessageNode('msg_adult'),
  ]);
  const code = gen(p, 'p04');
  ok(code.includes('await handle_callback_msg_adult(callback_query)'), 'await handle_callback_msg_adult должен быть в коде');
});

test('P05', 'greater_than без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18')])]);
  const code = gen(p, 'p05');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('P06', 'greater_than → генерируется блок try: _num_val = float(val)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18')])]);
  const code = gen(p, 'p06');
  ok(code.includes('_num_val = float(val)'), '_num_val = float(val) должен быть в коде');
  ok(code.includes('except (ValueError, TypeError)'), 'except (ValueError, TypeError) должен быть в коде');
});

test('P07', 'greater_than → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18'), makeBranch('else')])]);
  syntax(gen(p, 'p07'), 'p07');
});

test('P08', 'greater_than с дробным значением (18.5) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', '18.5'), makeBranch('else')])]);
  syntax(gen(p, 'p08'), 'p08');
});

test('P09', 'greater_than + else → корректная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranch('greater_than', '18', 'msg_adult'),
    makeBranch('else', '', 'msg_child'),
  ]), makeMessageNode('msg_adult'), makeMessageNode('msg_child')]);
  const code = gen(p, 'p09');
  ok(code.includes('if _num_val is not None and _num_val > 18:'), 'if должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'p09');
});

test('P10', 'несколько greater_than → несколько elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90'),
    makeBranch('greater_than', '70'),
    makeBranch('greater_than', '50'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'p10');
  ok(code.includes('if _num_val is not None and _num_val > 90:'), 'if > 90 должен быть');
  ok(code.includes('elif _num_val is not None and _num_val > 70:'), 'elif > 70 должен быть');
  ok(code.includes('elif _num_val is not None and _num_val > 50:'), 'elif > 50 должен быть');
  syntax(code, 'p10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК Q: Оператор less_than
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок Q: Оператор less_than ────────────────────────────────────');

test('Q01', 'less_than → генерируется _num_val < N', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', '18')])]);
  const code = gen(p, 'q01');
  ok(code.includes('_num_val < 18'), '_num_val < 18 должен быть в коде');
});

test('Q02', 'less_than как первая ветка → if _num_val is not None and _num_val < N:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', '18')])]);
  const code = gen(p, 'q02');
  ok(code.includes('if _num_val is not None and _num_val < 18:'), 'if _num_val is not None and _num_val < 18: должен быть в коде');
});

test('Q03', 'less_than как вторая ветка → elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranch('less_than', '10'),
    makeBranch('less_than', '18'),
  ])]);
  const code = gen(p, 'q03');
  ok(code.includes('elif _num_val is not None and _num_val < 18:'), 'elif _num_val is not None and _num_val < 18: должен быть в коде');
});

test('Q04', 'less_than + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'age', [makeBranch('less_than', '18', 'msg_child')]),
    makeMessageNode('msg_child'),
  ]);
  const code = gen(p, 'q04');
  ok(code.includes('await handle_callback_msg_child(callback_query)'), 'await handle_callback_msg_child должен быть в коде');
});

test('Q05', 'less_than без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', '18')])]);
  const code = gen(p, 'q05');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('Q06', 'less_than → генерируется блок try: _num_val = float(val)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', '18')])]);
  const code = gen(p, 'q06');
  ok(code.includes('_num_val = float(val)'), '_num_val = float(val) должен быть в коде');
  ok(code.includes('except (ValueError, TypeError)'), 'except (ValueError, TypeError) должен быть в коде');
});

test('Q07', 'less_than → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', '18'), makeBranch('else')])]);
  syntax(gen(p, 'q07'), 'q07');
});

test('Q08', 'less_than с отрицательным значением (-5) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'temp', [makeBranch('less_than', '-5'), makeBranch('else')])]);
  syntax(gen(p, 'q08'), 'q08');
});

test('Q09', 'greater_than + less_than + else → корректная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranch('greater_than', '65'),
    makeBranch('less_than', '18'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 'q09');
  ok(code.includes('if _num_val is not None and _num_val > 65:'), 'if > 65 должен быть');
  ok(code.includes('elif _num_val is not None and _num_val < 18:'), 'elif < 18 должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'q09');
});

test('Q10', 'less_than с нулём (0) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'balance', [makeBranch('less_than', '0'), makeBranch('else')])]);
  syntax(gen(p, 'q10'), 'q10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК R: Оператор between
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок R: Оператор between ──────────────────────────────────────');

test('R01', 'between → генерируется N1 <= _num_val <= N2', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65')])]);
  const code = gen(p, 'r01');
  ok(code.includes('18 <= _num_val <= 65'), '18 <= _num_val <= 65 должен быть в коде');
});

test('R02', 'between как первая ветка → if _num_val is not None and N1 <= _num_val <= N2:', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65')])]);
  const code = gen(p, 'r02');
  ok(code.includes('if _num_val is not None and 18 <= _num_val <= 65:'), 'if с between должен быть в коде');
});

test('R03', 'between как вторая ветка → elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranch('greater_than', '100'),
    makeBranchBetween('18', '65'),
  ])]);
  const code = gen(p, 'r03');
  ok(code.includes('elif _num_val is not None and 18 <= _num_val <= 65:'), 'elif с between должен быть в коде');
});

test('R04', 'between + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65', 'msg_working')]),
    makeMessageNode('msg_working'),
  ]);
  const code = gen(p, 'r04');
  ok(code.includes('await handle_callback_msg_working(callback_query)'), 'await handle_callback_msg_working должен быть в коде');
});

test('R05', 'between без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65')])]);
  const code = gen(p, 'r05');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('R06', 'between → генерируется блок try: _num_val = float(val)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65')])]);
  const code = gen(p, 'r06');
  ok(code.includes('_num_val = float(val)'), '_num_val = float(val) должен быть в коде');
  ok(code.includes('except (ValueError, TypeError)'), 'except (ValueError, TypeError) должен быть в коде');
});

test('R07', 'between → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '65'), makeBranch('else')])]);
  syntax(gen(p, 'r07'), 'r07');
});

test('R08', 'between с дробными значениями (0.5, 99.9) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [makeBranchBetween('0.5', '99.9'), makeBranch('else')])]);
  syntax(gen(p, 'r08'), 'r08');
});

test('R09', 'between + else → корректная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [
    makeBranchBetween('18', '65', 'msg_working'),
    makeBranch('else', '', 'msg_other'),
  ]), makeMessageNode('msg_working'), makeMessageNode('msg_other')]);
  const code = gen(p, 'r09');
  ok(code.includes('if _num_val is not None and 18 <= _num_val <= 65:'), 'if between должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'r09');
});

test('R10', 'greater_than + between + less_than + else → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90'),
    makeBranchBetween('50', '90'),
    makeBranch('less_than', '50'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 'r10'), 'r10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК S: Числовые операторы — граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок S: Числовые операторы — граничные случаи ────────────────');

test('S01', 'greater_than без числового значения (пустая строка) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('greater_than', ''), makeBranch('else')])]);
  syntax(gen(p, 's01'), 's01');
});

test('S02', 'less_than с нечисловым value → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('less_than', 'abc'), makeBranch('else')])]);
  syntax(gen(p, 's02'), 's02');
});

test('S03', 'between с одинаковыми границами → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranchBetween('18', '18'), makeBranch('else')])]);
  syntax(gen(p, 's03'), 's03');
});

test('S04', 'только числовые ветки без else → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90'),
    makeBranch('less_than', '50'),
    makeBranchBetween('50', '90'),
  ])]);
  syntax(gen(p, 's04'), 's04');
});

test('S05', '_num_val вычисляется один раз (не дублируется в коде)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90'),
    makeBranch('less_than', '50'),
    makeBranchBetween('50', '90'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 's05');
  // Найти тело функции cond1
  const condIdx = code.indexOf('async def handle_callback_cond1');
  const nextDefIdx = code.indexOf('async def ', condIdx + 1);
  const funcBody = nextDefIdx > 0 ? code.substring(condIdx, nextDefIdx) : code.substring(condIdx);
  const floatCount = (funcBody.match(/_num_val = float\(val\)/g) || []).length;
  const tryCount = (funcBody.match(/try:/g) || []).length;
  ok(floatCount === 1, `_num_val = float(val) должен быть ровно 1 раз в функции, найдено: ${floatCount}`);
  ok(tryCount === 1, `try: должен быть ровно 1 раз в функции, найдено: ${tryCount}`);
});

test('S06', 'смешанные операторы (filled + greater_than + equals + else) → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [
    makeBranch('filled'),
    makeBranch('greater_than', '100'),
    makeBranch('equals', 'special'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 's06'), 's06');
});

test('S07', '5 числовых веток → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90'),
    makeBranch('greater_than', '80'),
    makeBranch('greater_than', '70'),
    makeBranch('greater_than', '60'),
    makeBranch('less_than', '60'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 's07'), 's07');
});

test('S08', 'числовые операторы + большой граф → синтаксис OK', () => {
  const messages = Array.from({ length: 10 }, (_, i) => makeMessageNode(`msg${i + 1}`, `Ответ ${i + 1}`));
  const cond = makeConditionNode('cond1', 'score', [
    makeBranch('greater_than', '90', 'msg1'),
    makeBranchBetween('70', '90', 'msg2'),
    makeBranch('less_than', '70', 'msg3'),
    makeBranch('else', '', 'msg4'),
  ]);
  syntax(gen(makeCleanProject([cond, ...messages]), 's08'), 's08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК T: Системные операторы (is_private, is_group, is_channel)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок T: Системные операторы ───────────────────────────────────');

test('T01', 'is_private — базовый случай: генерирует chat.type == private', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_private', '', 'msg1')]), makeMessageNode('msg1')]);
  const code = gen(p, 't01');
  ok(code.includes("callback_query.message.chat.type == 'private'"), "chat.type == 'private' должен быть в коде");
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'await handle_callback_msg1 должен быть в коде');
  syntax(code, 't01');
});

test('T02', 'is_group — базовый случай: генерирует chat.type in (group, supergroup)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_group', '', 'msg1')]), makeMessageNode('msg1')]);
  const code = gen(p, 't02');
  ok(code.includes("callback_query.message.chat.type in ('group', 'supergroup')"), "chat.type in ('group', 'supergroup') должен быть в коде");
  syntax(code, 't02');
});

test('T03', 'is_channel — базовый случай: генерирует chat.type == channel', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_channel', '', 'msg1')]), makeMessageNode('msg1')]);
  const code = gen(p, 't03');
  ok(code.includes("callback_query.message.chat.type == 'channel'"), "chat.type == 'channel' должен быть в коде");
  syntax(code, 't03');
});

test('T04', 'смешанный: is_private + filled + else', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [
    makeBranch('is_private', '', 'msg_priv'),
    makeBranch('filled', '', 'msg_filled'),
    makeBranch('else', '', 'msg_other'),
  ]), makeMessageNode('msg_priv'), makeMessageNode('msg_filled'), makeMessageNode('msg_other')]);
  const code = gen(p, 't04');
  ok(code.includes("callback_query.message.chat.type == 'private'"), 'is_private должен быть в коде');
  ok(code.includes('val'), 'val должен быть в коде');
  ok(code.includes('else:'), 'else: должен быть в коде');
  syntax(code, 't04');
});

test('T05', 'только системные ветки — нет _all_vars внутри обработчика cond1', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_private'),
    makeBranch('is_group'),
    makeBranch('else'),
  ])]);
  const code = gen(p, 't05');
  // Извлекаем тело обработчика cond1 (от async def до следующего async def или конца)
  const handlerStart = code.indexOf('async def handle_callback_cond1');
  ok(handlerStart !== -1, 'handle_callback_cond1 должен быть в коде');
  const nextHandler = code.indexOf('\nasync def ', handlerStart + 1);
  const handlerBody = nextHandler !== -1 ? code.slice(handlerStart, nextHandler) : code.slice(handlerStart);
  ok(!handlerBody.includes('_all_vars'), '_all_vars НЕ должен быть внутри handle_callback_cond1');
  ok(!handlerBody.includes('init_all_user_vars'), 'init_all_user_vars НЕ должен вызываться внутри handle_callback_cond1');
  syntax(code, 't05');
});

test('T06', 'is_group генерирует supergroup тоже', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_group')])]);
  const code = gen(p, 't06');
  ok(code.includes('supergroup'), 'supergroup должен быть в коде для is_group');
});

test('T07', 'системная ветка с target — корректный вызов handle_callback_', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_channel', '', 'msg_chan')]), makeMessageNode('msg_chan')]);
  const code = gen(p, 't07');
  ok(code.includes('await handle_callback_msg_chan(callback_query)'), 'await handle_callback_msg_chan должен быть в коде');
});

test('T08', 'системная ветка без target — pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_private')])]);
  const code = gen(p, 't08');
  ok(code.includes('pass'), 'pass должен быть в коде для ветки без target');
});

test('T09', 'несколько системных операторов — правильный if/elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_private', '', 'msg1'),
    makeBranch('is_group', '', 'msg2'),
    makeBranch('is_channel', '', 'msg3'),
  ]), makeMessageNode('msg1'), makeMessageNode('msg2'), makeMessageNode('msg3')]);
  const code = gen(p, 't09');
  ok(code.includes("if callback_query.message.chat.type == 'private'"), 'первая ветка — if');
  ok(code.includes("elif callback_query.message.chat.type in ('group', 'supergroup')"), 'вторая ветка — elif');
  ok(code.includes("elif callback_query.message.chat.type == 'channel'"), 'третья ветка — elif');
  syntax(code, 't09');
});

test('T10', 'системные + числовые + строковые + else — все 4 прохода в правильном порядке', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('is_private', '', 'msg_priv'),
    makeBranch('greater_than', '90', 'msg_high'),
    makeBranch('equals', 'special', 'msg_spec'),
    makeBranch('else', '', 'msg_other'),
  ]), makeMessageNode('msg_priv'), makeMessageNode('msg_high'), makeMessageNode('msg_spec'), makeMessageNode('msg_other')]);
  const code = gen(p, 't10');
  ok(code.includes("callback_query.message.chat.type == 'private'"), 'системная ветка должна быть');
  ok(code.includes('_num_val > 90'), 'числовая ветка должна быть');
  ok(code.includes('val == "special"'), 'строковая ветка должна быть');
  ok(code.includes('else:'), 'else должен быть');
  // Порядок: системные → числовые → строковые → else
  const sysIdx = code.indexOf("callback_query.message.chat.type == 'private'");
  const numIdx = code.indexOf('_num_val > 90');
  const strIdx = code.indexOf('val == "special"');
  const elseIdx = code.indexOf('else:');
  ok(sysIdx < numIdx, 'системные должны идти перед числовыми');
  ok(numIdx < strIdx, 'числовые должны идти перед строковыми');
  ok(strIdx < elseIdx, 'строковые должны идти перед else');
  syntax(code, 't10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК U: Операторы is_admin, is_premium, is_bot
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок U: Операторы is_admin, is_premium, is_bot ───────────────');

test('U01', 'is_admin без переменной → генерируется async def handle_callback_', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin')])]);
  const code = gen(p, 'u01');
  ok(code.includes('async def handle_callback_cond1'), 'async def handle_callback_cond1 должен быть в коде');
});

test('U02', 'is_admin → генерирует callback_query.from_user.id in ADMIN_IDS', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin')])]);
  const code = gen(p, 'u02');
  ok(code.includes('callback_query.from_user.id in ADMIN_IDS'), 'callback_query.from_user.id in ADMIN_IDS должен быть в коде');
});

test('U03', 'is_premium → генерирует getattr(callback_query.from_user, \'is_premium\', False)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_premium')])]);
  const code = gen(p, 'u03');
  ok(code.includes("getattr(callback_query.from_user, 'is_premium', False)"), "getattr is_premium должен быть в коде");
});

test('U04', 'is_bot → генерирует getattr(callback_query.from_user, \'is_bot\', False)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_bot')])]);
  const code = gen(p, 'u04');
  ok(code.includes("getattr(callback_query.from_user, 'is_bot', False)"), "getattr is_bot должен быть в коде");
});

test('U05', 'только is_admin — нет _all_vars внутри обработчика', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin'), makeBranch('else')])]);
  const code = gen(p, 'u05');
  const handlerStart = code.indexOf('async def handle_callback_cond1');
  ok(handlerStart !== -1, 'handle_callback_cond1 должен быть в коде');
  const nextHandler = code.indexOf('\nasync def ', handlerStart + 1);
  const handlerBody = nextHandler !== -1 ? code.slice(handlerStart, nextHandler) : code.slice(handlerStart);
  ok(!handlerBody.includes('_all_vars'), '_all_vars НЕ должен быть внутри handle_callback_cond1');
  ok(!handlerBody.includes('init_all_user_vars'), 'init_all_user_vars НЕ должен вызываться внутри handle_callback_cond1');
  syntax(code, 'u05');
});

test('U06', 'только is_premium — нет _all_vars внутри обработчика', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_premium'), makeBranch('else')])]);
  const code = gen(p, 'u06');
  const handlerStart = code.indexOf('async def handle_callback_cond1');
  const nextHandler = code.indexOf('\nasync def ', handlerStart + 1);
  const handlerBody = nextHandler !== -1 ? code.slice(handlerStart, nextHandler) : code.slice(handlerStart);
  ok(!handlerBody.includes('_all_vars'), '_all_vars НЕ должен быть внутри handle_callback_cond1');
  syntax(code, 'u06');
});

test('U07', 'только is_bot — нет _all_vars внутри обработчика', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_bot'), makeBranch('else')])]);
  const code = gen(p, 'u07');
  const handlerStart = code.indexOf('async def handle_callback_cond1');
  const nextHandler = code.indexOf('\nasync def ', handlerStart + 1);
  const handlerBody = nextHandler !== -1 ? code.slice(handlerStart, nextHandler) : code.slice(handlerStart);
  ok(!handlerBody.includes('_all_vars'), '_all_vars НЕ должен быть внутри handle_callback_cond1');
  syntax(code, 'u07');
});

test('U08', 'is_admin как первая ветка → if (не elif)', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin'), makeBranch('else')])]);
  const code = gen(p, 'u08');
  ok(code.includes('if callback_query.from_user.id in ADMIN_IDS'), 'if должен быть (не elif)');
  ok(!code.includes('elif callback_query.from_user.id in ADMIN_IDS'), 'elif НЕ должен быть для первой ветки');
});

test('U09', 'is_admin + is_premium → if/elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin'), makeBranch('is_premium')])]);
  const code = gen(p, 'u09');
  ok(code.includes('if callback_query.from_user.id in ADMIN_IDS'), 'if is_admin должен быть');
  ok(code.includes("elif getattr(callback_query.from_user, 'is_premium', False)"), 'elif is_premium должен быть');
  syntax(code, 'u09');
});

test('U10', 'is_admin + is_premium + is_bot + else → полная цепочка', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_admin', '', 'msg1'),
    makeBranch('is_premium', '', 'msg2'),
    makeBranch('is_bot', '', 'msg3'),
    makeBranch('else', '', 'msg4'),
  ]), makeMessageNode('msg1'), makeMessageNode('msg2'), makeMessageNode('msg3'), makeMessageNode('msg4')]);
  const code = gen(p, 'u10');
  ok(code.includes('if callback_query.from_user.id in ADMIN_IDS'), 'if is_admin должен быть');
  ok(code.includes("elif getattr(callback_query.from_user, 'is_premium', False)"), 'elif is_premium должен быть');
  ok(code.includes("elif getattr(callback_query.from_user, 'is_bot', False)"), 'elif is_bot должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'u10');
});

test('U11', 'is_admin + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', '', [makeBranch('is_admin', '', 'msg_admin')]),
    makeMessageNode('msg_admin'),
  ]);
  const code = gen(p, 'u11');
  ok(code.includes('await handle_callback_msg_admin(callback_query)'), 'await handle_callback_msg_admin должен быть в коде');
});

test('U12', 'is_premium + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', '', [makeBranch('is_premium', '', 'msg_prem')]),
    makeMessageNode('msg_prem'),
  ]);
  const code = gen(p, 'u12');
  ok(code.includes('await handle_callback_msg_prem(callback_query)'), 'await handle_callback_msg_prem должен быть в коде');
});

test('U13', 'is_bot + target → await handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', '', [makeBranch('is_bot', '', 'msg_bot')]),
    makeMessageNode('msg_bot'),
  ]);
  const code = gen(p, 'u13');
  ok(code.includes('await handle_callback_msg_bot(callback_query)'), 'await handle_callback_msg_bot должен быть в коде');
});

test('U14', 'is_admin без target → pass', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin')])]);
  const code = gen(p, 'u14');
  ok(code.includes('pass'), 'pass должен быть в коде');
});

test('U15', 'смешанный is_admin + filled + else → все ветки в коде', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_role', [
    makeBranch('is_admin', '', 'msg_admin'),
    makeBranch('filled', '', 'msg_filled'),
    makeBranch('else', '', 'msg_other'),
  ]), makeMessageNode('msg_admin'), makeMessageNode('msg_filled'), makeMessageNode('msg_other')]);
  const code = gen(p, 'u15');
  ok(code.includes('callback_query.from_user.id in ADMIN_IDS'), 'is_admin должен быть');
  ok(code.includes('val'), 'val должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  ok(code.includes('_all_vars'), '_all_vars должен быть (есть переменная)');
  syntax(code, 'u15');
});

test('U16', 'смешанный is_premium + greater_than + else → все 3 прохода', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('is_premium', '', 'msg_prem'),
    makeBranch('greater_than', '100', 'msg_high'),
    makeBranch('else', '', 'msg_other'),
  ]), makeMessageNode('msg_prem'), makeMessageNode('msg_high'), makeMessageNode('msg_other')]);
  const code = gen(p, 'u16');
  ok(code.includes("getattr(callback_query.from_user, 'is_premium', False)"), 'is_premium должен быть');
  ok(code.includes('_num_val > 100'), 'числовая ветка должна быть');
  ok(code.includes('else:'), 'else: должен быть');
  // Порядок: системные → числовые → else
  const sysIdx = code.indexOf("getattr(callback_query.from_user, 'is_premium', False)");
  const numIdx = code.indexOf('_num_val > 100');
  ok(sysIdx < numIdx, 'системные должны идти перед числовыми');
  syntax(code, 'u16');
});

test('U17', 'is_admin + is_private + else → оба системных в коде', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_admin', '', 'msg1'),
    makeBranch('is_private', '', 'msg2'),
    makeBranch('else', '', 'msg3'),
  ]), makeMessageNode('msg1'), makeMessageNode('msg2'), makeMessageNode('msg3')]);
  const code = gen(p, 'u17');
  ok(code.includes('callback_query.from_user.id in ADMIN_IDS'), 'is_admin должен быть');
  ok(code.includes("callback_query.message.chat.type == 'private'"), 'is_private должен быть');
  ok(code.includes('else:'), 'else: должен быть');
  syntax(code, 'u17');
});

test('U18', 'is_bot + is_premium + is_admin → порядок if/elif/elif', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_bot'),
    makeBranch('is_premium'),
    makeBranch('is_admin'),
  ])]);
  const code = gen(p, 'u18');
  const botIdx = code.indexOf("if getattr(callback_query.from_user, 'is_bot', False)");
  const premIdx = code.indexOf("elif getattr(callback_query.from_user, 'is_premium', False)");
  const adminIdx = code.indexOf('elif callback_query.from_user.id in ADMIN_IDS');
  ok(botIdx !== -1, 'is_bot должен быть первым (if)');
  ok(premIdx > botIdx, 'is_premium должен идти после is_bot');
  ok(adminIdx > premIdx, 'is_admin должен идти после is_premium');
  syntax(code, 'u18');
});

test('U19', 'is_admin → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_admin'), makeBranch('else')])]);
  syntax(gen(p, 'u19'), 'u19');
});

test('U20', 'is_premium → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_premium'), makeBranch('else')])]);
  syntax(gen(p, 'u20'), 'u20');
});

test('U21', 'is_bot → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [makeBranch('is_bot'), makeBranch('else')])]);
  syntax(gen(p, 'u21'), 'u21');
});

test('U22', 'все 6 системных операторов вместе → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_private'),
    makeBranch('is_group'),
    makeBranch('is_channel'),
    makeBranch('is_admin'),
    makeBranch('is_premium'),
    makeBranch('is_bot'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 'u22'), 'u22');
});

test('U23', 'is_admin + is_premium + is_bot — нет дублирования функций', () => {
  const p = makeCleanProject([makeConditionNode('cond1', '', [
    makeBranch('is_admin'),
    makeBranch('is_premium'),
    makeBranch('is_bot'),
  ])]);
  const code = gen(p, 'u23');
  const defs = (code.match(/async def handle_callback_cond1/g) || []).length;
  ok(defs === 1, `Должен быть ровно 1 def handle_callback_cond1, найдено: ${defs}`);
});

test('U24', 'is_admin + is_premium + is_bot + все строковые + else → синтаксис OK', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'role', [
    makeBranch('is_admin'),
    makeBranch('is_premium'),
    makeBranch('is_bot'),
    makeBranch('filled'),
    makeBranch('equals', 'vip'),
    makeBranch('contains', 'mod'),
    makeBranch('else'),
  ])]);
  syntax(gen(p, 'u24'), 'u24');
});

test('U25', 'is_admin + is_premium + is_bot + числовые + строковые + else → правильный порядок', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'score', [
    makeBranch('is_admin', '', 'msg1'),
    makeBranch('is_premium', '', 'msg2'),
    makeBranch('is_bot', '', 'msg3'),
    makeBranch('greater_than', '90', 'msg4'),
    makeBranch('equals', 'special', 'msg5'),
    makeBranch('else', '', 'msg6'),
  ]), makeMessageNode('msg1'), makeMessageNode('msg2'), makeMessageNode('msg3'),
     makeMessageNode('msg4'), makeMessageNode('msg5'), makeMessageNode('msg6')]);
  const code = gen(p, 'u25');
  const adminIdx = code.indexOf('callback_query.from_user.id in ADMIN_IDS');
  const premIdx  = code.indexOf("getattr(callback_query.from_user, 'is_premium', False)");
  const botIdx   = code.indexOf("getattr(callback_query.from_user, 'is_bot', False)");
  const numIdx   = code.indexOf('_num_val > 90');
  const strIdx   = code.indexOf('val == "special"');
  const elseIdx  = code.indexOf('else:');
  ok(adminIdx < premIdx,  'is_admin перед is_premium');
  ok(premIdx  < botIdx,   'is_premium перед is_bot');
  ok(botIdx   < numIdx,   'системные перед числовыми');
  ok(numIdx   < strIdx,   'числовые перед строковыми');
  ok(strIdx   < elseIdx,  'строковые перед else');
  syntax(code, 'u25');
});

// ════════════════════════════════════════════════════════════════════════════
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
