/**
 * @fileoverview Фаза 24 — Блоки G–H: интеграция и производительность
 * @module tests/test-phase24-set-variable-c
 *
 * Блок G: Интеграция (G01–G04)
 * Блок H: Производительность (H01–H02)
 */

import {
  results, test, ok, syntax, gen, makeCleanProject,
} from './test-phase24-set-variable-helpers.ts';
import {
  makeSetVariableNode, makeMessageNode, makeCommandTriggerNode,
} from './test-phase24-set-variable-factories.ts';

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Интеграция
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Интеграция ───────────────────────────────────────────────');

test('G01', 'command_trigger → set_variable → message: все три обработчика в коде', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd_1', '/start', 'sv_1'),
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
    makeMessageNode('msg_1', 'Готово!'),
  ]), 'g01');
  ok(code.includes('handle_callback_sv_1'), 'handle_callback_sv_1 должен быть в коде');
  ok(code.includes('handle_callback_msg_1'), 'handle_callback_msg_1 должен быть в коде');
});

test('G02', 'set_variable с autoTransitionTo на message — переход генерируется', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
    makeMessageNode('msg_1', 'Привет!'),
  ]), 'g02');
  ok(code.includes('handle_callback_msg_1'), 'Переход к handle_callback_msg_1 должен быть в коде');
});

test('G03', 'несколько set_variable узлов — каждый получает свой handle_callback_', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { assignments: [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }] }),
    makeSetVariableNode('sv_2', { assignments: [{ id: 'a2', variable: 'y', value: '2', mode: 'text' }] }),
    makeSetVariableNode('sv_3', { assignments: [{ id: 'a3', variable: 'z', value: '3', mode: 'text' }] }),
  ]), 'g03');
  ok(code.includes('handle_callback_sv_1'), 'handle_callback_sv_1 должен быть в коде');
  ok(code.includes('handle_callback_sv_2'), 'handle_callback_sv_2 должен быть в коде');
  ok(code.includes('handle_callback_sv_3'), 'handle_callback_sv_3 должен быть в коде');
});

test('G04', 'синтаксис OK для интеграционного сценария', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd_1', '/start', 'sv_1'),
    makeSetVariableNode('sv_1', {
      assignments: [
        { id: 'a1', variable: 'name', value: '{first_name}', mode: 'text' },
        { id: 'a2', variable: 'step', value: '{step} + 1', mode: 'expression' },
      ],
      autoTransitionTo: 'msg_1',
      enableAutoTransition: true,
    }),
    makeMessageNode('msg_1', 'Привет, {name}!'),
  ]), 'g04'), 'g04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Производительность ───────────────────────────────────────');

test('H01', 'генерация одного узла быстрее 200ms', () => {
  const start = Date.now();
  gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'h01');
  const elapsed = Date.now() - start;
  ok(elapsed < 200, `Генерация заняла ${elapsed}ms, ожидалось < 200ms`);
});

test('H02', 'генерация 10 узлов set_variable быстрее 500ms', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeSetVariableNode(`sv_${i}`, {
      assignments: [{ id: `a${i}`, variable: `var${i}`, value: `val${i}`, mode: 'text' }],
    })
  );
  const start = Date.now();
  gen(makeCleanProject(nodes), 'h02');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Генерация 10 узлов заняла ${elapsed}ms, ожидалось < 500ms`);
});

export { results };
