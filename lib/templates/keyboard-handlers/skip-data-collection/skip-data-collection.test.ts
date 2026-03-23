/**
 * @fileoverview Тесты для шаблона skip-data-collection
 * @module templates/skip-data-collection/skip-data-collection.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSkipDataCollectionCheck } from './skip-data-collection.renderer';
import {
  validParamsBasic,
  validParamsWithIndent,
} from './skip-data-collection.fixture';
import { skipDataCollectionParamsSchema } from './skip-data-collection.schema';

describe('generateSkipDataCollectionCheck()', () => {
  it('генерирует проверку skipDataCollectionTransition', () => {
    const result = generateSkipDataCollectionCheck(validParamsBasic);
    assert.ok(result.includes('skipDataCollectionTransition'));
  });

  it('генерирует update_user_data_in_db', () => {
    const result = generateSkipDataCollectionCheck(validParamsBasic);
    assert.ok(result.includes('await update_user_data_in_db'));
    assert.ok(result.includes('user_name'));
  });

  it('генерирует сброс флага', () => {
    const result = generateSkipDataCollectionCheck(validParamsBasic);
    assert.ok(result.includes('del user_data[user_id]["skipDataCollectionTransition"]'));
  });

  it('генерирует logging.info', () => {
    const result = generateSkipDataCollectionCheck(validParamsBasic);
    assert.ok(result.includes('logging.info'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateSkipDataCollectionCheck(validParamsWithIndent);
    assert.ok(result.includes('        # Проверяем, был ли переход'));
  });
});

describe('skipDataCollectionParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(skipDataCollectionParamsSchema.safeParse(validParamsBasic).success);
  });

  it('отклоняет отсутствие variableName', () => {
    assert.ok(!skipDataCollectionParamsSchema.safeParse({ variableValue: 'v' }).success);
  });

  it('отклоняет отсутствие variableValue', () => {
    assert.ok(!skipDataCollectionParamsSchema.safeParse({ variableName: 'n' }).success);
  });
});

describe('Производительность', () => {
  it('generateSkipDataCollectionCheck: быстрее 10ms', () => {
    const start = Date.now();
    generateSkipDataCollectionCheck(validParamsBasic);
    assert.ok(Date.now() - start < 10);
  });
});
