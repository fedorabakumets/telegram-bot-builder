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

test('A02', 'содержит get_user_variable(user_id, "user_name")', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'a02');
  ok(code.includes('get_user_variable(user_id, "user_name")'), 'get_user_variable(user_id, "user_name") должен быть в коде');
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

test('G01', 'variable = "user_name" → get_user_variable(user_id, "user_name")', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'user_name', [makeBranch('filled')])]);
  const code = gen(p, 'g01');
  ok(code.includes('get_user_variable(user_id, "user_name")'), 'get_user_variable(user_id, "user_name") должен быть в коде');
});

test('G02', 'variable = "age" → get_user_variable(user_id, "age")', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'age', [makeBranch('filled')])]);
  const code = gen(p, 'g02');
  ok(code.includes('get_user_variable(user_id, "age")'), 'get_user_variable(user_id, "age") должен быть в коде');
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
      data: { textSynonyms: ['привет'], textMatchType: 'exact', isPrivateOnly: false, adminOnly: false, requiresAuth: false, autoTransitionTo: 'cond1', buttons: [], keyboardType: 'none' },
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

test('L03', 'тело функции содержит val = get_user_variable(', () => {
  const p = makeCleanProject([makeConditionNode('cond1', 'x', [makeBranch('filled')])]);
  const code = gen(p, 'l03');
  ok(code.includes('val = get_user_variable('), 'val = get_user_variable( должен быть в теле функции');
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
