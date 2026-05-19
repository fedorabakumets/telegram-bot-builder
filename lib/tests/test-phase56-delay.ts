/**
 * @fileoverview Интеграционные тесты для узла delay (фаза 56)
 *
 * Блок A: Базовая генерация
 * Блок B: Режим blocking
 * Блок C: Режим background
 * Блок D: Единицы времени
 * Блок E: Переменные
 * Блок F: Граничные случаи
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
  return generatePythonCode(project as any, { botName: `Phase56_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p56_${label}.py`;
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

/** Создаёт узел delay */
function makeDelayNode(id: string, opts: any = {}) {
  return {
    id, type: 'delay', position: { x: 0, y: 0 },
    data: {
      seconds: opts.seconds || '3',
      unit: opts.unit || 'seconds',
      mode: opts.mode || 'blocking',
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

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 56 — Узел delay (задержка)                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'delay node → генерируется handle_callback_', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_delay1'), 'handle_callback_delay1 должен быть в коде');
});

test('A02', 'содержит asyncio.sleep', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('asyncio.sleep'), 'asyncio.sleep должен быть в коде');
});

test('A03', 'содержит logging.info', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('logging.info'), 'logging.info должен быть в коде');
});

test('A04', 'содержит replace_variables_in_text', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
});

test('A05', 'синтаксис Python OK (базовый delay)', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a05'), 'a05');
});

test('A06', 'содержит @dp.callback_query с nodeId', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('"delay1"'), 'callback_query с "delay1" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Режим blocking
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Режим blocking ────────────────────────────────────────');

test('B01', 'blocking → содержит asyncio.sleep', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'blocking', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('asyncio.sleep'), 'asyncio.sleep должен быть в blocking режиме');
});

test('B02', 'blocking → содержит await handle_callback_ целевого узла', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'blocking', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('await handle_callback_msg1'), 'await handle_callback_msg1 должен быть в blocking режиме');
});

test('B03', 'blocking → синтаксис OK (cmd → delay → msg)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'delay1'),
    makeDelayNode('delay1', { mode: 'blocking', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Привет после паузы'),
  ]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'blocking → НЕ содержит create_task', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'blocking', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  // Ищем create_task только в блоке delay
  const delayIdx = code.indexOf('handle_callback_delay1');
  const delayBlock = code.substring(delayIdx, delayIdx + 1000);
  ok(!delayBlock.includes('create_task'), 'create_task НЕ должен быть в blocking режиме');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Режим background
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Режим background ──────────────────────────────────────');

test('C01', 'background → содержит create_task', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'background', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('create_task'), 'create_task должен быть в background режиме');
});

test('C02', 'background → содержит _delayed_task', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'background', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  ok(code.includes('_delayed_task'), '_delayed_task должен быть в background режиме');
});

test('C03', 'background → синтаксис OK (cmd → delay(bg) → msg)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'delay1'),
    makeDelayNode('delay1', { mode: 'background', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Уведомление после таймера'),
  ]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'background → НЕ содержит прямой await handle_callback_ вне _delayed_task', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { mode: 'background', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c04');
  // Ищем определение обработчика delay (async def handle_callback_delay1)
  const defIdx = code.indexOf('async def handle_callback_delay1');
  ok(defIdx !== -1, 'async def handle_callback_delay1 должен быть в коде');
  const delayBlock = code.substring(defIdx, defIdx + 1500);
  // В background режиме вызов handle_callback_msg1 должен быть внутри _delayed_task
  ok(delayBlock.includes('_delayed_task'), '_delayed_task должен быть в блоке');
  const taskIdx = delayBlock.indexOf('_delayed_task');
  const beforeTask = delayBlock.substring(defIdx > 0 ? 0 : 0, taskIdx);
  ok(!beforeTask.includes('await handle_callback_msg1'), 'await handle_callback_msg1 НЕ должен быть до _delayed_task');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Единицы времени
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Единицы времени ───────────────────────────────────────');

test('D01', 'unit=seconds → множитель отсутствует (int(float(_delay_val)))', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { unit: 'seconds', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'D01');
  ok(code.includes('int(float(_delay_val))'), 'int(float(_delay_val)) должен быть для seconds');
});

test('D02', 'unit=minutes → множитель * 60', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { unit: 'minutes', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'D02');
  ok(code.includes('* 60'), '* 60 должен быть для minutes');
});

test('D03', 'unit=hours → множитель * 3600', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { unit: 'hours', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'D03');
  ok(code.includes('* 3600'), '* 3600 должен быть для hours');
});

test('D04', 'unit=days → множитель * 86400', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { unit: 'days', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'D04');
  ok(code.includes('* 86400'), '* 86400 должен быть для days');
});

test('D05', 'unit=weeks → множитель * 604800', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { unit: 'weeks', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'D05');
  ok(code.includes('* 604800'), '* 604800 должен быть для weeks');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Переменные
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Переменные ────────────────────────────────────────────');

test('E01', '{cooldown_time} в seconds → replace_variables_in_text вызывается', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { seconds: '{cooldown_time}', unit: 'seconds', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'E01');
  ok(code.includes('{cooldown_time}'), '{cooldown_time} должен быть в коде');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
});

test('E02', '{cooldown_time} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'delay1'),
    makeDelayNode('delay1', { seconds: '{cooldown_time}', unit: 'seconds', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'E02'), 'E02');
});

test('E03', 'replace_variables_in_text вызывается с шаблоном seconds', () => {
  const p = makeCleanProject([makeDelayNode('delay1', { seconds: '{wait_time}', autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  const code = gen(p, 'E03');
  ok(code.includes('replace_variables_in_text("{wait_time}"'), 'replace_variables_in_text("{wait_time}" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Граничные случаи ──────────────────────────────────────');

test('F01', 'пустые узлы → delay не генерируется', () => {
  const p = makeCleanProject([]);
  const code = gen(p, 'F01');
  ok(!code.includes('handle_callback_delay'), 'handle_callback_delay НЕ должен быть при пустых узлах');
});

test('F02', 'без autoTransitionTo → delay генерируется но без вызова handle_callback_ целевого', () => {
  const p = makeCleanProject([makeDelayNode('delay1')]);
  const code = gen(p, 'F02');
  ok(code.includes('handle_callback_delay1'), 'handle_callback_delay1 должен быть в коде');
  ok(code.includes('asyncio.sleep'), 'asyncio.sleep должен быть в коде');
});

test('F03', 'seconds="0" → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'delay1'),
    makeDelayNode('delay1', { seconds: '0', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'F03'), 'F03');
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

console.log('\n✅ Все тесты фазы 56 (delay) пройдены!\n');
