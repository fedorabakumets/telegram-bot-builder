/**
 * @fileoverview Тесты для утилит работы с сообщениями
 * Проверяет функции проверки и извлечения данных кнопок
 * @module tests/unit/utils/message-utils.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  hasButtons,
  getButtons,
  hasButtonClicked,
  getButtonText,
} from '../../../utils/message-utils';
import type { BotMessageWithMedia } from '../../../types';

/**
 * Создаёт тестовое сообщение с минимальными данными
 */
function createTestMessage(overrides: Partial<BotMessageWithMedia> = {}): BotMessageWithMedia {
  return {
    id: 1,
    createdAt: null,
    projectId: 1,
    userId: '123',
    messageType: 'bot',
    messageText: 'Test',
    messageData: null,
    nodeId: null,
    primaryMediaId: null,
    ...overrides,
  } as BotMessageWithMedia;
}

describe('message-utils', () => {
  describe('hasButtons', () => {
    it('должен возвращать false для сообщения без messageData', () => {
      const message = createTestMessage({ messageData: null });

      const result = hasButtons(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать false для сообщения без кнопок', () => {
      const message = createTestMessage({ messageData: {} });

      const result = hasButtons(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать false для пустого массива кнопок', () => {
      const message = createTestMessage({
        messageData: { buttons: [] },
      } as any);

      const result = hasButtons(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать true для сообщения с кнопками', () => {
      const message = createTestMessage({
        messageData: {
          buttons: [{ text: 'Click me' }],
        },
      } as any);

      const result = hasButtons(message);
      assert.strictEqual(result, true);
    });

    it('должен возвращать false если buttons не массив', () => {
      const message = createTestMessage({
        messageData: {
          buttons: 'not-array',
        },
      } as any);

      const result = hasButtons(message);
      assert.strictEqual(result, false);
    });
  });

  describe('getButtons', () => {
    it('должен возвращать пустой массив для сообщения без messageData', () => {
      const message = createTestMessage({ messageData: null });

      const result = getButtons(message);
      assert.deepStrictEqual(result, []);
    });

    it('должен возвращать пустой массив для сообщения без кнопок', () => {
      const message = createTestMessage({ messageData: {} });

      const result = getButtons(message);
      assert.deepStrictEqual(result, []);
    });

    it('должен возвращать пустой массив если buttons не массив', () => {
      const message = createTestMessage({
        messageData: {
          buttons: 'not-array',
        },
      } as any);

      const result = getButtons(message);
      assert.deepStrictEqual(result, []);
    });

    it('должен возвращать массив кнопок', () => {
      const expectedButtons = [
        { text: 'Button 1' },
        { text: 'Button 2' },
      ];

      const message = createTestMessage({
        messageData: {
          buttons: expectedButtons,
        },
      } as any);

      const result = getButtons(message);
      assert.deepStrictEqual(result, expectedButtons);
    });
  });

  describe('hasButtonClicked', () => {
    it('должен возвращать false для сообщения без messageData', () => {
      const message = createTestMessage({ messageData: null });

      const result = hasButtonClicked(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать false для сообщения без button_clicked', () => {
      const message = createTestMessage({ messageData: {} });

      const result = hasButtonClicked(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать false если button_clicked = false', () => {
      const message = createTestMessage({
        messageData: {
          button_clicked: false,
        },
      } as any);

      const result = hasButtonClicked(message);
      assert.strictEqual(result, false);
    });

    it('должен возвращать true если button_clicked = true', () => {
      const message = createTestMessage({
        messageData: {
          button_clicked: true,
        },
      } as any);

      const result = hasButtonClicked(message);
      assert.strictEqual(result, true);
    });
  });

  describe('getButtonText', () => {
    it('должен возвращать null для сообщения без messageData', () => {
      const message = createTestMessage({ messageData: null });

      const result = getButtonText(message);
      assert.strictEqual(result, null);
    });

    it('должен возвращать null для сообщения без button_text', () => {
      const message = createTestMessage({ messageData: {} });

      const result = getButtonText(message);
      assert.strictEqual(result, null);
    });

    it('должен возвращать форматированный текст кнопки', () => {
      const message = createTestMessage({
        messageData: {
          button_text: 'Click me',
        },
      } as any);

      const result = getButtonText(message);
      assert.strictEqual(result, 'Нажата: Click me');
    });

    it('должен возвращать null для пустого button_text', () => {
      const message = createTestMessage({
        messageData: {
          button_text: '',
        },
      } as any);

      const result = getButtonText(message);
      assert.strictEqual(result, null);
    });
  });
});
