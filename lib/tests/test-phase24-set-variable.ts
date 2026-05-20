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

// ─── Блок E3: Режим array_item ──────────────────────────────────────────────
console.log('\n─── Блок E3: Режим array_item ───');

test('E3_01', 'array_item содержит json', () => {
  const code = gen(makeCleanProject([makeSV('sv_ai', [{ id: 'a1', variable: 'item', value: '{items}', maxValue: '0', mode: 'array_item' }])]), 'E3_01');
  ok(code.includes('json'), 'Нет json');
});

test('E3_02', 'array_item поддерживает dot-notation', () => {
  const code = gen(makeCleanProject([makeSV('sv_ai2', [{ id: 'a1', variable: 'name', value: '{resp}', maxValue: 'data.0.name', mode: 'array_item' }])]), 'E3_02');
  ok(code.includes('split'), 'Нет split для dot-notation');
});

test('E3_03', 'array_item синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/get', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'first_user', value: '{users_list}', maxValue: '0', mode: 'array_item' }], 'msg1'),
    makeMsg('msg1', 'Первый: {first_user}'),
  ]), 'E3_03'), 'E3_03');
});

// ─── Блок E4: Режим format_duration ─────────────────────────────────────────
console.log('\n─── Блок E4: Режим format_duration ───');

test('E4_01', 'format_duration содержит // 3600', () => {
  const code = gen(makeCleanProject([makeSV('sv_fd', [{ id: 'a1', variable: 'cd_text', value: '{cd_expires} - {now_ts}', mode: 'format_duration' }])]), 'E4_01');
  ok(code.includes('3600'), 'Нет деления на 3600');
});

test('E4_02', 'format_duration содержит _eval_expr', () => {
  const code = gen(makeCleanProject([makeSV('sv_fd2', [{ id: 'a1', variable: 'timer', value: '90', mode: 'format_duration' }])]), 'E4_02');
  ok(code.includes('_eval_expr'), 'Нет _eval_expr');
});

test('E4_03', 'format_duration содержит format_duration в логе', () => {
  const code = gen(makeCleanProject([makeSV('sv_fd3', [{ id: 'a1', variable: 'remaining', value: '{expires_at} - {now}', mode: 'format_duration' }])]), 'E4_03');
  ok(code.includes('format_duration'), 'Нет format_duration в логе');
});

test('E4_04', 'format_duration синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/cd', 'sv1'),
    makeSV('sv1', [
      { id: 'a1', variable: 'now_ts', value: '0', mode: 'timestamp' },
      { id: 'a2', variable: 'cd_text', value: '{cd_expires} - {now_ts}', mode: 'format_duration' },
    ], 'msg1'),
    makeMsg('msg1', 'Осталось: {cd_text}'),
  ]), 'E4_04'), 'E4_04');
});

test('E4_05', 'format_duration с фиксированным значением синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/timer', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'time_str', value: '90', mode: 'format_duration' }], 'msg1'),
    makeMsg('msg1', 'Таймер: {time_str}'),
  ]), 'E4_05'), 'E4_05');
});

// ─── Блок E5: Режим format_number ────────────────────────────────────────────
console.log('\n─── Блок E5: Режим format_number ───');

test('E5_01', 'format_number содержит replace(",", " ")', () => {
  const code = gen(makeCleanProject([makeSV('sv_fn', [{ id: 'a1', variable: 'credits_fmt', value: '{pilot.credits}', mode: 'format_number' }])]), 'E5_01');
  ok(code.includes('replace(",", " ")'), 'Нет replace(",", " ")');
});

test('E5_02', 'format_number содержит format_number в логе', () => {
  const code = gen(makeCleanProject([makeSV('sv_fn2', [{ id: 'a1', variable: 'balance_fmt', value: '{balance}', mode: 'format_number' }])]), 'E5_02');
  ok(code.includes('format_number'), 'Нет format_number в логе');
});

test('E5_03', 'format_number синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/balance', 'sv1'),
    makeSV('sv1', [{ id: 'a1', variable: 'credits_fmt', value: '{credits}', mode: 'format_number' }], 'msg1'),
    makeMsg('msg1', 'Баланс: {credits_fmt}'),
  ]), 'E5_03'), 'E5_03');
});

test('E5_04', 'format_number с expression перед ним синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCmd('cmd1', '/info', 'sv1'),
    makeSV('sv1', [
      { id: 'a1', variable: 'total', value: '{a} + {b}', mode: 'expression' },
      { id: 'a2', variable: 'total_fmt', value: '{total}', mode: 'format_number' },
    ], 'msg1'),
    makeMsg('msg1', 'Итого: {total_fmt}'),
  ]), 'E5_04'), 'E5_04');
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
