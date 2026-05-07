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
