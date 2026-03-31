/**
 * @fileoverview Тесты для шаблона auto-transition
 * @module templates/auto-transition/auto-transition.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAutoTransition } from './auto-transition.renderer';
import {
  validParamsTargetExists,
  validParamsTargetMissing,
  validParamsWithIndent,
  expectedOutputTargetExists,
  expectedOutputTargetMissing,
} from './auto-transition.fixture';
import { autoTransitionParamsSchema } from './auto-transition.schema';

describe('generateAutoTransition()', () => {
  it('генерирует проверку is_fake_callback', () => {
    const result = generateAutoTransition(validParamsTargetExists);
    assert.ok(result.includes("is_fake_callback = getattr(callback_query, '_is_fake', False)"));
    assert.ok(result.includes('if not is_fake_callback:'));
  });

  it('генерирует вызов handle_callback для существующего узла', () => {
    const result = generateAutoTransition(validParamsTargetExists);
    assert.ok(result.includes(expectedOutputTargetExists));
  });

  it('генерирует предупреждение для несуществующего узла', () => {
    const result = generateAutoTransition(validParamsTargetMissing);
    assert.ok(result.includes(expectedOutputTargetMissing));
  });

  it('генерирует logging.info с ID узлов', () => {
    const result = generateAutoTransition(validParamsTargetExists);
    assert.ok(result.includes('node_source'));
    assert.ok(result.includes('node_target'));
  });

  it('генерирует return в конце', () => {
    const result = generateAutoTransition(validParamsTargetExists);
    assert.ok(result.includes('return'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateAutoTransition(validParamsWithIndent);
    assert.ok(result.includes("        is_fake_callback = getattr(callback_query, '_is_fake', False)"));
    assert.ok(result.includes('        if not is_fake_callback:'));
  });

  it('заменяет дефис на подчёркивание в имени функции', () => {
    const result = generateAutoTransition({
      nodeId: 'node-src',
      autoTransitionTarget: 'node-target',
      targetExists: true,
    });
    assert.ok(result.includes('handle_callback_node_target'));
  });
});

describe('autoTransitionParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(autoTransitionParamsSchema.safeParse(validParamsTargetExists).success);
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!autoTransitionParamsSchema.safeParse({
      autoTransitionTarget: 'node_b',
      targetExists: true,
    }).success);
  });

  it('отклоняет строку вместо boolean для targetExists', () => {
    assert.ok(!autoTransitionParamsSchema.safeParse({
      nodeId: 'a',
      autoTransitionTarget: 'b',
      targetExists: 'true',
    }).success);
  });
});

describe('Производительность', () => {
  it('generateAutoTransition: быстрее 10ms', () => {
    const start = Date.now();
    generateAutoTransition(validParamsTargetExists);
    assert.ok(Date.now() - start < 10);
  });
});
