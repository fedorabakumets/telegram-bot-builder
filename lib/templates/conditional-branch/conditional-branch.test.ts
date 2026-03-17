/**
 * @fileoverview Тесты для шаблона conditional-branch
 * @module templates/conditional-branch/conditional-branch.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateConditionalBranch } from './conditional-branch.renderer';
import {
  validParamsFirst,
  validParamsSecond,
  validParamsWithIndent,
  expectedOutputIf,
  expectedOutputElif,
} from './conditional-branch.fixture';
import { conditionalBranchParamsSchema } from './conditional-branch.schema';

describe('generateConditionalBranch()', () => {
  it('генерирует if для index=0', () => {
    const result = generateConditionalBranch(validParamsFirst);
    assert.ok(result.includes(expectedOutputIf));
  });

  it('генерирует elif для index>0', () => {
    const result = generateConditionalBranch(validParamsSecond);
    assert.ok(result.includes(expectedOutputElif));
  });

  it('не генерирует elif для index=0', () => {
    const result = generateConditionalBranch(validParamsFirst);
    assert.ok(!result.includes('elif'));
  });

  it('не генерирует if для index>0', () => {
    const result = generateConditionalBranch(validParamsSecond);
    assert.ok(!result.includes('\nif '));
  });

  it('применяет кастомный отступ', () => {
    const result = generateConditionalBranch(validParamsWithIndent);
    assert.ok(result.includes('    if next_node_id == "node_custom":'));
  });

  it('включает nodeId в условие', () => {
    const result = generateConditionalBranch(validParamsFirst);
    assert.ok(result.includes('"node_abc"'));
  });
});

describe('conditionalBranchParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(conditionalBranchParamsSchema.safeParse(validParamsFirst).success);
  });

  it('отклоняет отрицательный index', () => {
    assert.ok(!conditionalBranchParamsSchema.safeParse({ index: -1, nodeId: 'n' }).success);
  });

  it('отклоняет дробный index', () => {
    assert.ok(!conditionalBranchParamsSchema.safeParse({ index: 1.5, nodeId: 'n' }).success);
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!conditionalBranchParamsSchema.safeParse({ index: 0 }).success);
  });
});

describe('Производительность', () => {
  it('generateConditionalBranch: быстрее 10ms', () => {
    const start = Date.now();
    generateConditionalBranch(validParamsFirst);
    assert.ok(Date.now() - start < 10);
  });
});
