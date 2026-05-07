/**
 * @fileoverview Фаза 24 — Блоки D–F: автопереход, несколько присваиваний, граничные случаи
 * @module tests/test-phase24-set-variable-b
 *
 * Блок D: Автопереход (D01–D05)
 * Блок E: Несколько присваиваний (E01–E05)
 * Блок F: Граничные случаи (F01–F05)
 */

import {
  results, test, ok, syntax, gen, makeCleanProject,
} from './test-phase24-set-variable-helpers.ts';
import { makeSetVariableNode } from './test-phase24-set-variable-factories.ts';

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Автопереход
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Автопереход ──────────────────────────────────────────────');

test('D01', 'autoTransitionTo: msg_1 + enableAutoTransition: true → handle_callback_msg_1', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
  ]), 'd01');
  ok(code.includes('handle_callback_msg_1'), 'handle_callback_msg_1 должен быть в коде при автопереходе');
});

test('D02', 'содержит FakeCallback или fake_cb при автопереходе', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
  ]), 'd02');
  ok(
    code.includes('FakeCallback') || code.includes('fake_cb'),
    'FakeCallback или fake_cb должен быть в коде при автопереходе',
  );
});

test('D03', 'без autoTransitionTo — нет handle_callback_msg_1 в коде', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: '', enableAutoTransition: false }),
  ]), 'd03');
  ok(!code.includes('handle_callback_msg_1'), 'handle_callback_msg_1 не должен быть в коде без автоперехода');
});

test('D04', 'автопереход передаёт state=state', () => {
  const code = gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
  ]), 'd04');
  ok(code.includes('state=state'), 'state=state должен передаваться при автопереходе');
});

test('D05', 'синтаксис OK с автопереходом', () => {
  syntax(gen(makeCleanProject([
    makeSetVariableNode('sv_1', { autoTransitionTo: 'msg_1', enableAutoTransition: true }),
  ]), 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Несколько присваиваний
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Несколько присваиваний ───────────────────────────────────');

test('E01', 'три assignments — все три переменные присутствуют в коде', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [
      { id: 'a1', variable: 'alpha', value: '1', mode: 'text' },
      { id: 'a2', variable: 'beta', value: '2', mode: 'text' },
      { id: 'a3', variable: 'gamma', value: '3', mode: 'text' },
    ],
  })]), 'e01');
  ok(code.includes('"alpha"'), 'Переменная alpha должна быть в коде');
  ok(code.includes('"beta"'), 'Переменная beta должна быть в коде');
  ok(code.includes('"gamma"'), 'Переменная gamma должна быть в коде');
});

test('E02', 'порядок присваиваний сохраняется (первая переменная раньше второй)', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [
      { id: 'a1', variable: 'first_var', value: 'A', mode: 'text' },
      { id: 'a2', variable: 'second_var', value: 'B', mode: 'text' },
    ],
  })]), 'e02');
  const posFirst = code.indexOf('"first_var"');
  const posSecond = code.indexOf('"second_var"');
  ok(posFirst < posSecond, `first_var (pos ${posFirst}) должна быть раньше second_var (pos ${posSecond})`);
});

test('E03', 'узел с 5 assignments генерирует 5 строк user_data[user_id]', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`, variable: `var${i}`, value: `val${i}`, mode: 'text' as const,
    })),
  })]), 'e03');
  const count = (code.match(/user_data\[user_id\]/g) || []).length;
  ok(count >= 5, `Ожидалось минимум 5 строк user_data[user_id], найдено: ${count}`);
});

test('E04', 'смешанные режимы (text + expression) в одном узле', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [
      { id: 'a1', variable: 'name', value: '{first_name}', mode: 'text' },
      { id: 'a2', variable: 'score', value: '{score} + 10', mode: 'expression' },
    ],
  })]), 'e04');
  ok(code.includes('resolve_var('), 'resolve_var должен быть в коде');
  ok(code.includes('eval_expr('), 'eval_expr должен быть в коде');
});

test('E05', 'синтаксис OK для нескольких assignments', () => {
  syntax(gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [
      { id: 'a1', variable: 'x', value: 'hello', mode: 'text' },
      { id: 'a2', variable: 'y', value: '{x} + 1', mode: 'expression' },
      { id: 'a3', variable: 'z', value: '{first_name}', mode: 'text' },
    ],
  })]), 'e05'), 'e05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Граничные случаи ─────────────────────────────────────────');

test('F01', 'пустой assignments: [] — генерирует обработчик без ошибок', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', { assignments: [] })]), 'f01');
  ok(code.includes('handle_callback_sv_1'), 'Обработчик должен генерироваться даже при пустых assignments');
});

test('F02', 'пустое имя переменной variable: "" — код генерируется без краша', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: '', value: 'test', mode: 'text' }],
  })]), 'f02');
  ok(typeof code === 'string' && code.length > 0, 'Код должен генерироваться без краша');
});

test('F03', 'пустое значение value: "" — resolve_var вызывается с ""', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'myvar', value: '', mode: 'text' }],
  })]), 'f03');
  ok(code.includes('resolve_var('), 'resolve_var должен вызываться даже с пустым значением');
  ok(code.includes('""'), 'Пустая строка "" должна быть в коде');
});

test('F04', 'узел без autoTransitionTo — нет FakeCallback в коде', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    autoTransitionTo: '',
    enableAutoTransition: false,
  })]), 'f04');
  ok(!code.includes('FakeCallback'), 'FakeCallback не должен быть в коде без автоперехода');
});

test('F05', 'синтаксис OK для пустых assignments', () => {
  syntax(gen(makeCleanProject([makeSetVariableNode('sv_1', { assignments: [] })]), 'f05'), 'f05');
});

export { results };
