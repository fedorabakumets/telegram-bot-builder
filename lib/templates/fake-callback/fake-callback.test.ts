/**
 * @fileoverview Тесты для шаблона fake-callback
 * @module templates/fake-callback/fake-callback.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateFakeCallback } from './fake-callback.renderer';
import {
  validParamsBasic,
  validParamsWithDashes,
  validParamsWithIndent,
} from './fake-callback.fixture';
import { fakeCallbackParamsSchema } from './fake-callback.schema';

describe('generateFakeCallback()', () => {
  it('генерирует fake_callback объект', () => {
    const result = generateFakeCallback(validParamsBasic);
    assert.ok(result.includes('fake_callback = aiogram_types.SimpleNamespace'));
  });

  it('генерирует fake_message объект', () => {
    const result = generateFakeCallback(validParamsBasic);
    assert.ok(result.includes('fake_message = aiogram_types.SimpleNamespace'));
  });

  it('генерирует вызов handle_callback с safeFunctionName', () => {
    const result = generateFakeCallback(validParamsBasic);
    assert.ok(result.includes('await handle_callback_node_target(fake_callback)'));
  });

  it('генерирует logging.info с ID узлов', () => {
    const result = generateFakeCallback(validParamsBasic);
    assert.ok(result.includes('node_source'));
    assert.ok(result.includes('node_target'));
  });

  it('генерирует data с targetNodeId', () => {
    const result = generateFakeCallback(validParamsBasic);
    assert.ok(result.includes('data="node_target"'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateFakeCallback(validParamsWithIndent);
    assert.ok(result.includes('        # ⚡ Автопереход к узлу node_b'));
  });

  it('использует safeFunctionName с подчёркиваниями', () => {
    const result = generateFakeCallback(validParamsWithDashes);
    assert.ok(result.includes('handle_callback_node_target_1'));
  });
});

describe('fakeCallbackParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(fakeCallbackParamsSchema.safeParse(validParamsBasic).success);
  });

  it('отклоняет отсутствие targetNodeId', () => {
    assert.ok(!fakeCallbackParamsSchema.safeParse({
      sourceNodeId: 'a',
      safeFunctionName: 'a',
    }).success);
  });
});

describe('Производительность', () => {
  it('generateFakeCallback: быстрее 10ms', () => {
    const start = Date.now();
    generateFakeCallback(validParamsBasic);
    assert.ok(Date.now() - start < 10);
  });
});
