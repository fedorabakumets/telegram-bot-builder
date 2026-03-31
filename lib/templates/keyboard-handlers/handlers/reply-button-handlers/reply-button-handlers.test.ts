/**
 * @fileoverview Тесты для reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateReplyButtonHandlers } from './reply-button-handlers.renderer';
import {
  replyButtonHandlersFixture,
  emptyNodesFixture,
  noReplyNodesFixture,
  multiSelectFixture,
} from './reply-button-handlers.fixture';

describe('generateReplyButtonHandlers', () => {
  it('должен генерировать обработчики для reply кнопок', () => {
    const result = generateReplyButtonHandlers(replyButtonHandlersFixture);

    assert.ok(result.includes('@dp.message(lambda message: message.text == "Опция 1")'));
    assert.ok(result.includes('@dp.message(lambda message: message.text == "Опция 2")'));
    assert.ok(result.includes('async def handle_reply_btn1'));
    assert.ok(result.includes('async def handle_reply_btn2'));
    assert.ok(result.includes('fake_callback = SimpleNamespace('));
    assert.ok(result.includes('await handle_callback_node2(fake_callback)'));
    assert.ok(!result.includes('await handle_callback_node2(message)'));
  });

  it('должен генерировать пустую строку для пустых узлов', () => {
    const result = generateReplyButtonHandlers(emptyNodesFixture);

    assert.strictEqual(result, '');
  });

  it('должен генерировать пустую строку для узлов без reply кнопок', () => {
    const result = generateReplyButtonHandlers(noReplyNodesFixture);

    assert.strictEqual(result, '');
  });

  it('должен генерировать обработчики с поддержкой multi-select', () => {
    const result = generateReplyButtonHandlers(multiSelectFixture);

    assert.ok(result.includes('multi_select_node'));
    assert.ok(result.includes('multi_select_type'));
  });

  it('должен инициализировать user_data перед записью last_node_id', () => {
    const result = generateReplyButtonHandlers(replyButtonHandlersFixture);

    assert.ok(result.includes('if user_id not in user_data:'));
    assert.ok(result.includes('user_data[user_id] = {}'));
    assert.ok(result.includes('user_data[user_id]["last_node_id"] = "node2"'));
  });
});
