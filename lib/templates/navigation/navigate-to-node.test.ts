/**
 * @fileoverview Тесты для шаблона navigate-to-node
 * @module templates/navigation/navigate-to-node.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateNavigateToNode, generateNavigateToNodeCall, generateNavigateToNodeWithText } from './navigate-to-node.renderer';
import { validParamsEmpty } from './navigate-to-node.fixture';
import { navigateToNodeParamsSchema } from './navigate-to-node.schema';

describe('generateNavigateToNode()', () => {
  it('генерирует async def navigate_to_node', () => {
    const result = generateNavigateToNode();
    assert.ok(result.includes('async def navigate_to_node'));
  });

  it('генерирует параметры функции', () => {
    const result = generateNavigateToNode();
    assert.ok(result.includes('message'));
    assert.ok(result.includes('node_id: str'));
  });

  it('генерирует replace_variables_in_text', () => {
    const result = generateNavigateToNode();
    assert.ok(result.includes('replace_variables_in_text'));
  });

  it('генерирует message.answer', () => {
    const result = generateNavigateToNode();
    assert.ok(result.includes('message.answer'));
  });
});

describe('generateNavigateToNodeCall()', () => {
  it('генерирует вызов navigate_to_node', () => {
    const result = generateNavigateToNodeCall('node_1');
    assert.ok(result.includes('await navigate_to_node(message, "node_1")'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateNavigateToNodeCall('node_1', 'message', '    ');
    assert.ok(result.startsWith('    await navigate_to_node'));
  });
});

describe('generateNavigateToNodeWithText()', () => {
  it('генерирует вызов с text параметром', () => {
    const result = generateNavigateToNodeWithText('node_1', 'my_text');
    assert.ok(result.includes('text=my_text'));
  });
});

describe('navigateToNodeParamsSchema', () => {
  it('принимает пустой объект', () => {
    assert.ok(navigateToNodeParamsSchema.safeParse({}).success);
  });
});

describe('Производительность', () => {
  it('generateNavigateToNode: быстрее 10ms', () => {
    const start = Date.now();
    generateNavigateToNode();
    assert.ok(Date.now() - start < 10);
  });
});
