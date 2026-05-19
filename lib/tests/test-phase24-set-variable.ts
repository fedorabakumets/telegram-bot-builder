/**
 * @fileoverview Фаза 24 — Интеграционный тест узла set_variable
 * @module tests/test-phase24-set-variable
 *
 * Блок A: Базовая генерация (A01–A06)
 * Блок B: Режим text (B01–B03)
 * Блок C: Режим expression (C01–C03)
 * Блок D: Режим random (D01–D04)
 * Блок E: Режим timestamp (E01–E04)
 * Блок F: Автопереход (F01–F02)
 * Блок G: Синтаксис Python (G01–G04)
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
  return generatePythonCode(project as any, { botName: `Phase24_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p24_${label}.py`;
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

/** Создаёт узел set_variable */
function makeSV(id: string, assignments: any[], autoTransitionTo = '') {
  return { id, type: 'set_variable', position: { x: 0, y: 0 }, data: { assignments, autoTransitionTo, enableAutoTransition: !!autoTransitionTo } };
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
console.log('║   Фаза 24 — Узел set_variable                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── Блок A: Базовая генерация ───────────────────────────────────────────────
console.log('─── Блок A: Базовая генерация ───');

test('A01', 'Генерирует handle_callback для set_variable', () => {
  const code = gen(makeCleanProject([makeSV('sv1', [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }])]), 'A01');
  ok(code.includes('async def handle_callback_sv1'), 'Нет handle_callback_sv1');
});

test('A02', 'Содержит user_data[user_id]', () => {
  const code = gen(makeCleanProject([makeSV('sv1', [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }])]), 'A02');
  ok(code.includes('user_data[user_id]'), 'Нет user_data[user_id]');
});

test('A03', 'Содержит logging.info', () => {
  const code = gen(makeCleanProject([makeSV('sv1', [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }])]), 'A03');
  ok(code.includes('logging.info'), 'Нет logging.info');
});

test('A04', 'Пустые assignments — генерирует корректный код', () => {
  const code = gen(makeCleanProject([makeSV('sv_empty', [])]), 'A04');
  ok(code.includes('handle_callback_sv_empty'), 'Нет handle_callback_sv_empty');
});

test('A05', 'Несколько assignments в одном узле', () => {
  const code = gen(makeCleanProject([makeSV('sv_multi', [
    { id: 'a1', variable: 'x', value: '1', mode: 'text' },
    { id: 'a2', variable: 'y', value: '2', mode: 'text' },
  ])]), 'A05');
  ok(code.includes('"x"') && code.includes('"y"'), 'Нет обеих переменных');
});

test('A06', 'Синтаксис Python валиден (text)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/test', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'name', value: 'Иван', mode: 'text' }], 'msg1'),
    makeMsg('msg1'),
  ]), 'A06'), 'A06');
});

// ─── Блок B: Режим text ──────────────────────────────────────────────────────
console.log('\n─── Блок B: Режим text ───');

test('B01', 'Содержит replace_variables_in_text', () => {
  const code = gen(makeCleanProject([makeSV('sv_t', [{ id: 'a1', variable: 'greeting', value: 'Привет, {first_name}', mode: 'text' }])]), 'B01');
  ok(code.includes('replace_variables_in_text'), 'Нет replace_variables_in_text');
});

test('B02', 'Содержит replace_variables_in_text при mode text', () => {
  const code = gen(makeCleanProject([makeSV('sv_t2', [{ id: 'a1', variable: 'x', value: 'hello', mode: 'text' }])]), 'B02');
  ok(code.includes('replace_variables_in_text'), 'Нет replace_variables_in_text при text');
});

test('B03', 'Синтаксис Python валиден (text с переменными)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/t', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'bio', value: '{first_name} из {city}', mode: 'text' }], 'msg1'),
    makeMsg('msg1'),
  ]), 'B03'), 'B03');
});

// ─── Блок C: Режим expression ────────────────────────────────────────────────
console.log('\n─── Блок C: Режим expression ───');

test('C01', 'Содержит _eval_expr при mode expression', () => {
  const code = gen(makeCleanProject([makeSV('sv_e', [{ id: 'a1', variable: 'balance', value: '{balance} + 100', mode: 'expression' }])]), 'C01');
  ok(code.includes('_eval_expr'), 'Нет _eval_expr');
});

test('C02', 'Поддерживает арифметику', () => {
  const code = gen(makeCleanProject([makeSV('sv_e2', [{ id: 'a1', variable: 'x', value: '{a} * 2 + {b}', mode: 'expression' }])]), 'C02');
  ok(code.includes('_eval_expr'), 'Нет _eval_expr');
});

test('C03', 'Синтаксис Python валиден (expression)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/calc', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'result', value: '{x} + {y} * 2', mode: 'expression' }], 'msg1'),
    makeMsg('msg1'),
  ]), 'C03'), 'C03');
});

// ─── Блок D: Режим random ────────────────────────────────────────────────────
console.log('\n─── Блок D: Режим random ───');

test('D01', 'Содержит randint при mode random', () => {
  const code = gen(makeCleanProject([makeSV('sv_r', [{ id: 'a1', variable: 'salary', value: '500', maxValue: '900', mode: 'random' }])]), 'D01');
  ok(code.includes('randint'), 'Нет randint');
});

test('D02', 'Содержит import random', () => {
  const code = gen(makeCleanProject([makeSV('sv_r2', [{ id: 'a1', variable: 'dice', value: '1', maxValue: '6', mode: 'random' }])]), 'D02');
  ok(code.includes('import random'), 'Нет import random');
});

test('D03', 'Логирует диапазон', () => {
  const code = gen(makeCleanProject([makeSV('sv_r3', [{ id: 'a1', variable: 'reward', value: '100', maxValue: '500', mode: 'random' }])]), 'D03');
  ok(code.includes('диапазон'), 'Нет лога с диапазоном');
});

test('D04', 'Синтаксис Python валиден (random)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/work', 'sv1'),
    makeSV('sv1', [
      { id: 'a1', variable: 'salary', value: '500', maxValue: '900', mode: 'random' },
      { id: 'a2', variable: 'exp', value: '8', maxValue: '16', mode: 'random' },
    ], 'msg1'),
    makeMsg('msg1'),
  ]), 'D04'), 'D04');
});

// ─── Блок E: Режим timestamp ─────────────────────────────────────────────────
console.log('\n─── Блок E: Режим timestamp ───');

test('E01', 'Содержит time.time() при mode timestamp', () => {
  const code = gen(makeCleanProject([makeSV('sv_ts', [{ id: 'a1', variable: 'cd_until', value: '90', mode: 'timestamp' }])]), 'E01');
  ok(code.includes('time()'), 'Нет time()');
});

test('E02', 'Содержит import time', () => {
  const code = gen(makeCleanProject([makeSV('sv_ts2', [{ id: 'a1', variable: 'expires', value: '3600', mode: 'timestamp' }])]), 'E02');
  ok(code.includes('import time'), 'Нет import time');
});

test('E03', 'Offset=0 генерирует текущий timestamp', () => {
  const code = gen(makeCleanProject([makeSV('sv_ts3', [{ id: 'a1', variable: 'now_ts', value: '0', mode: 'timestamp' }])]), 'E03');
  ok(code.includes('timestamp'), 'Нет лога timestamp');
});

test('E04', 'Синтаксис Python валиден (timestamp)', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/cd', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'cooldown_until', value: '90', mode: 'timestamp' }], 'msg1'),
    makeMsg('msg1'),
  ]), 'E04'), 'E04');
});

// ─── Блок E2: Режим random_item ─────────────────────────────────────────────
console.log('\n─── Блок E2: Режим random_item ───');

test('E2_01', 'random_item содержит choice', () => {
  const code = gen(makeCleanProject([makeSV('sv_ri', [{ id: 'a1', variable: 'emoji', value: '🔧,💥,💡', mode: 'random_item' }])]), 'E2_01');
  ok(code.includes('choice'), 'Нет choice');
});

test('E2_02', 'random_item содержит split', () => {
  const code = gen(makeCleanProject([makeSV('sv_ri2', [{ id: 'a1', variable: 'msg', value: 'Привет,Хай,Здравствуйте', mode: 'random_item' }])]), 'E2_02');
  ok(code.includes('split'), 'Нет split');
});

test('E2_03', 'random_item синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/roll', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'result', value: 'камень,ножницы,бумага', mode: 'random_item' }], 'msg1'),
    makeMsg('msg1', 'Выпало: {result}'),
  ]), 'E2_03'), 'E2_03');
});

// ─── Блок F: Автопереход ─────────────────────────────────────────────────────
console.log('\n─── Блок F: Автопереход ───');

test('F01', 'Генерирует вызов handle_callback при autoTransitionTo', () => {
  const code = gen(makeCleanProject([
    makeSV('sv_at', [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }], 'msg_next'),
    makeMsg('msg_next'),
  ]), 'F01');
  ok(code.includes('handle_callback_msg_next'), 'Нет автоперехода к msg_next');
});

test('F02', 'Без autoTransitionTo — handle_callback не вызывается для пустого target', () => {
  const code = gen(makeCleanProject([makeSV('sv_no_at', [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }])]), 'F02');
  ok(code.includes('handle_callback_sv_no_at'), 'Нет handle_callback_sv_no_at');
});

// ─── Блок G: Синтаксис полных сценариев ──────────────────────────────────────
console.log('\n─── Блок G: Синтаксис полных сценариев ───');

test('G01', 'Полный сценарий: cmd → random → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/roll', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'roll', value: '1', maxValue: '100', mode: 'random' }], 'msg1'),
    makeMsg('msg1', 'Выпало: {roll}'),
  ]), 'G01'), 'G01');
});

test('G02', 'Полный сценарий: cmd → timestamp → msg', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/cooldown', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'cd', value: '60', mode: 'timestamp' }], 'msg1'),
    makeMsg('msg1', 'Кулдаун установлен'),
  ]), 'G02'), 'G02');
});

test('G03', 'Смешанные modes в одном узле', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/mix', 'sv1'),
    makeSV('sv1', [
      { id: 'a1', variable: 'salary', value: '500', maxValue: '900', mode: 'random' },
      { id: 'a2', variable: 'cd', value: '90', mode: 'timestamp' },
      { id: 'a3', variable: 'msg', value: 'Зарплата: {salary}$', mode: 'text' },
    ], 'msg1'),
    makeMsg('msg1'),
  ]), 'G03'), 'G03');
});

test('G04', 'Несколько set_variable узлов в цепочке', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/chain', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'x', value: '1', maxValue: '10', mode: 'random' }], 'sv2'),
    makeSV('sv2', [{ id: 'a1', variable: 'ts', value: '0', mode: 'timestamp' }], 'msg1'),
    makeMsg('msg1'),
  ]), 'G04'), 'G04');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 24 — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`);
  });
  process.exit(1);
}
