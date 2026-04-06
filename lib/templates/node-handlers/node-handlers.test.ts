/**
 * @fileoverview Тесты для генерации обработчиков узлов, включая keyboard-ноду
 * @module templates/node-handlers/node-handlers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateNodeHandlers } from './node-handlers.dispatcher';

describe('generateNodeHandlers', () => {
  it('генерирует безопасный no-op обработчик для keyboard-ноды', () => {
    const result = generateNodeHandlers([
      {
        id: 'kbd_1',
        type: 'keyboard',
        position: { x: 0, y: 0 },
        data: {
          buttons: [],
          keyboardType: 'none',
        },
      } as any,
    ], false, false);

    assert.ok(result.includes('handle_callback_kbd_1'));
    assert.ok(result.includes('keyboard-ноды'));
  });

  it('генерирует обработчик для отдельного input-узла', () => {
    const result = generateNodeHandlers([
      {
        id: 'input_1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {
          inputType: 'text',
          inputVariable: 'user_name',
          inputTargetNodeId: 'msg_done',
          appendVariable: false,
          saveToDatabase: true,
        },
      } as any,
    ], false, false);

    assert.ok(result.includes('handle_callback_input_1'));
    assert.ok(result.includes('"waiting_for_input"'));
    assert.ok(result.includes('"variable": "user_name"'));
  });
  it('does not duplicate callback handler for get_managed_bot_token', () => {
    const result = generateNodeHandlers([
      {
        id: 'get_token_1',
        type: 'get_managed_bot_token',
        position: { x: 0, y: 0 },
        data: {
          autoTransitionTo: 'msg_done',
          enableAutoTransition: true,
          botIdSource: 'manual',
          botIdManual: '123456789',
          saveTokenTo: 'bot_token',
          buttons: [],
          keyboardType: 'none',
        },
      } as any,
      {
        id: 'msg_done',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'done',
          buttons: [],
          keyboardType: 'none',
        },
      } as any,
    ], false, false);

    const handlerMatches = result.match(/async def handle_callback_get_token_1\(/g) || [];
    assert.equal(handlerMatches.length, 1);
    assert.ok(result.includes('get_managed_bot_token(user_id=int(_bot_id))'));
  });
});
