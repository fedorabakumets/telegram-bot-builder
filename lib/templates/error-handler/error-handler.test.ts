/**
 * @fileoverview Тесты для шаблона error-handler
 * @module templates/error-handler/error-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateErrorHandler } from './error-handler.renderer';
import {
  validParamsDefault,
  validParamsWithIndent,
  expectedOutputExcept,
} from './error-handler.fixture';
import { errorHandlerParamsSchema } from './error-handler.schema';

describe('generateErrorHandler()', () => {
  it('генерирует except Exception as e:', () => {
    const result = generateErrorHandler(validParamsDefault);
    assert.ok(result.includes(expectedOutputExcept));
  });

  it('генерирует logging.error', () => {
    const result = generateErrorHandler(validParamsDefault);
    assert.ok(result.includes('logging.error'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateErrorHandler(validParamsWithIndent);
    assert.ok(result.includes('    except Exception as e:'));
  });

  it('работает без параметров', () => {
    const result = generateErrorHandler();
    assert.ok(result.includes('except Exception as e:'));
  });
});

describe('errorHandlerParamsSchema', () => {
  it('принимает пустой объект', () => {
    assert.ok(errorHandlerParamsSchema.safeParse({}).success);
  });

  it('принимает indentLevel', () => {
    assert.ok(errorHandlerParamsSchema.safeParse({ indentLevel: '    ' }).success);
  });

  it('отклоняет числовой indentLevel', () => {
    assert.ok(!errorHandlerParamsSchema.safeParse({ indentLevel: 4 }).success);
  });
});

describe('Производительность', () => {
  it('generateErrorHandler: быстрее 10ms', () => {
    const start = Date.now();
    generateErrorHandler(validParamsDefault);
    assert.ok(Date.now() - start < 10);
  });
});
