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
});
