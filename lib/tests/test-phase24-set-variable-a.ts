/**
 * @fileoverview Фаза 24 — Блок A: базовая генерация set_variable
 * @module tests/test-phase24-set-variable-a
 * Блок A: Базовая генерация (A01–A08)
 */

import {
  results, test, ok, syntax, gen, makeCleanProject,
} from './test-phase24-set-variable-helpers.ts';
import { makeSetVariableNode } from './test-phase24-set-variable-factories.ts';

console.log('── Блок A: Базовая генерация ────────────────────────────────────────');

test('A01', 'генерирует @dp.callback_query(lambda c: c.data == "sv_1")', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a01');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "sv_1")'), 'Декоратор с nodeId должен быть в коде');
});

test('A02', 'генерирует async def handle_callback_sv_1(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a02');
  ok(code.includes('async def handle_callback_sv_1('), 'Обработчик handle_callback_sv_1 должен быть в коде');
});

test('A03', 'содержит user_data[user_id]', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a03');
  ok(code.includes('user_data[user_id]'), 'user_data[user_id] должен быть в коде');
});

test('A04', 'содержит logging.info(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a04');
  ok(code.includes('logging.info('), 'logging.info должен присутствовать в коде');
});

test('A05', 'содержит logging.error(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a05');
  ok(code.includes('logging.error('), 'logging.error должен присутствовать в коде');
});

test('A06', 'содержит try: и except Exception as e:', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a06');
  ok(code.includes('try:'), 'Блок try: должен быть в коде');
  ok(code.includes('except Exception as e:'), 'Блок except Exception as e: должен быть в коде');
});

test('A07', 'содержит if user_id not in user_data:', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a07');
  ok(code.includes('if user_id not in user_data:'), 'Проверка user_id not in user_data должна быть в коде');
});

test('A08', 'синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([makeSetVariableNode('sv_1')]), 'a08'), 'a08');
});

export { results };

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Режим text — resolve_var
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Режим text — replace_variables_in_text ───────────────────');

test('B01', 'mode text → вызывает replace_variables_in_text(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'greeting', value: 'Привет!', mode: 'text' }],
  })]), 'b01');
  ok(code.includes('replace_variables_in_text('), 'replace_variables_in_text должен быть в коде для режима text');
});

test('B02', 'mode text → обработчик sv_1 не содержит _eval_expr(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'name', value: 'Иван', mode: 'text' }],
  })]), 'b02');
  // Вырезаем только тело обработчика sv_1, не весь файл
  const start = code.indexOf('async def handle_callback_sv_1(');
  const end = code.indexOf('\n@dp.', start + 1);
  const handler = end > start ? code.slice(start, end) : code.slice(start);
  ok(!handler.includes('_eval_expr('), '_eval_expr не должен быть в обработчике sv_1 для режима text');
});

test('B03', 'шаблон {first_name} встраивается в replace_variables_in_text как строка', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'greeting', value: 'Привет, {first_name}!', mode: 'text' }],
  })]), 'b03');
  ok(code.includes('Привет, {first_name}!'), 'Шаблон {first_name} должен быть встроен в код');
});

test('B04', 'вложенный путь {response.data.name} встраивается корректно', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'user_name', value: '{response.data.name}', mode: 'text' }],
  })]), 'b04');
  ok(code.includes('{response.data.name}'), 'Вложенный путь {response.data.name} должен быть в коде');
});

test('B05', 'статическая строка без переменных встраивается через replace_variables_in_text', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'status', value: 'active', mode: 'text' }],
  })]), 'b05');
  ok(code.includes('replace_variables_in_text('), 'replace_variables_in_text должен вызываться даже для статической строки');
  ok(code.includes('active'), 'Значение active должно быть в коде');
});

test('B06', 'имя переменной встраивается как ключ user_data[user_id]["varname"]', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'my_var', value: 'test', mode: 'text' }],
  })]), 'b06');
  ok(code.includes('"my_var"'), 'Имя переменной my_var должно быть в коде как строковый ключ');
});

test('B07', 'синтаксис OK для режима text с шаблоном', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'greeting', value: 'Привет, {first_name} {last_name}!', mode: 'text' }],
  })]), 'b07');
  syntax(code, 'b07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Режим expression — eval_expr
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Режим expression — _eval_expr ────────────────────────────');

test('C01', 'mode expression → вызывает _eval_expr(', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
  })]), 'c01');
  ok(code.includes('_eval_expr('), '_eval_expr должен быть в коде для режима expression');
});

test('C02', 'mode expression → обработчик sv_1 не содержит replace_variables_in_text', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
  })]), 'c02');
  // Вырезаем только тело обработчика sv_1
  const start = code.indexOf('async def handle_callback_sv_1(');
  const end = code.indexOf('\n@dp.', start + 1);
  const handler = end > start ? code.slice(start, end) : code.slice(start);
  ok(!handler.includes('replace_variables_in_text('), 'replace_variables_in_text не должен быть в обработчике sv_1 для режима expression');
});

test('C03', 'выражение {step} + 1 встраивается в _eval_expr как строка', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
  })]), 'c03');
  ok(code.includes('{step} + 1'), 'Выражение {step} + 1 должно быть встроено в код');
});

test('C04', 'умножение {price} * {quantity} встраивается корректно', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'total', value: '{price} * {quantity}', mode: 'expression' }],
  })]), 'c04');
  ok(code.includes('{price} * {quantity}'), 'Выражение {price} * {quantity} должно быть в коде');
  ok(code.includes('_eval_expr('), '_eval_expr должен быть в коде');
});

test('C05', 'имя переменной встраивается как ключ user_data[user_id]["step"]', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
  })]), 'c05');
  ok(code.includes('"step"'), 'Имя переменной step должно быть в коде как строковый ключ');
});

test('C06', 'синтаксис OK для режима expression', () => {
  const code = gen(makeCleanProject([makeSetVariableNode('sv_1', {
    assignments: [{ id: 'a1', variable: 'score', value: '{score} + 10', mode: 'expression' }],
  })]), 'c06');
  syntax(code, 'c06');
});
