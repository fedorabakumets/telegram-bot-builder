/**
 * @fileoverview Тесты для шаблона conditional-messages
 * @module templates/conditional-messages/conditional-messages.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateConditionalMessages } from './conditional-messages.renderer';
import {
  validParamsSingle,
  validParamsMultiple,
  validParamsEmpty,
  validParamsWithIndent,
} from './conditional-messages.fixture';
import { conditionalMessagesParamsSchema } from './conditional-messages.schema';

describe('generateConditionalMessages()', () => {
  it('генерирует проверку условных сообщений', () => {
    const result = generateConditionalMessages(validParamsSingle);
    assert.ok(result.includes('# Проверяем условные сообщения'));
  });

  it('генерирует text = None', () => {
    const result = generateConditionalMessages(validParamsSingle);
    assert.ok(result.includes('text = None'));
  });

  it('генерирует if для первого условия', () => {
    const result = generateConditionalMessages(validParamsSingle);
    assert.ok(result.includes('if ('));
  });

  it('генерирует elif для второго условия', () => {
    const result = generateConditionalMessages(validParamsMultiple);
    assert.ok(result.includes('elif ('));
  });

  it('генерирует else с defaultText', () => {
    const result = generateConditionalMessages(validParamsSingle);
    assert.ok(result.includes('else:'));
    assert.ok(result.includes('"Привет!"'));
  });

  it('генерирует get_user_from_db', () => {
    const result = generateConditionalMessages(validParamsSingle);
    assert.ok(result.includes('await get_user_from_db(user_id)'));
  });

  it('работает с пустыми условиями', () => {
    const result = generateConditionalMessages(validParamsEmpty);
    assert.ok(result.includes('text = None'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateConditionalMessages(validParamsWithIndent);
    assert.ok(result.includes('    # Проверяем условные сообщения'));
  });
});

describe('conditionalMessagesParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(conditionalMessagesParamsSchema.safeParse(validParamsSingle).success);
  });

  it('принимает пустой массив условий', () => {
    assert.ok(conditionalMessagesParamsSchema.safeParse(validParamsEmpty).success);
  });

  it('отклоняет отсутствие defaultText', () => {
    assert.ok(!conditionalMessagesParamsSchema.safeParse({
      conditionalMessages: [],
    }).success);
  });
});

describe('Производительность', () => {
  it('generateConditionalMessages: быстрее 10ms', () => {
    const start = Date.now();
    generateConditionalMessages(validParamsSingle);
    assert.ok(Date.now() - start < 10);
  });
});
