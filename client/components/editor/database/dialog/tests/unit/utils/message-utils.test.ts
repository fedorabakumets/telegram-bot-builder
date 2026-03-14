/**
 * @fileoverview Тесты для утилит работы с сообщениями
 * Проверяет функции проверки и извлечения данных кнопок
 * @module tests/unit/utils/message-utils.test
 */

/// <reference types="vitest/globals" />

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

describe('hasButtons', () => {
  it('должен возвращать false для сообщения без messageData', () => {
    const message = createTestMessage({ messageData: null });

    const result = hasButtons(message);
    expect(result).toBe(false);
  });

  it('должен возвращать false для сообщения без кнопок', () => {
    const message = createTestMessage({ messageData: {} });

    const result = hasButtons(message);
    expect(result).toBe(false);
  });

  it('должен возвращать false для пустого массива кнопок', () => {
    const message = createTestMessage({
      messageData: { buttons: [] },
    } as any);

    const result = hasButtons(message);
    expect(result).toBe(false);
  });

  it('должен возвращать true для сообщения с кнопками', () => {
    const message = createTestMessage({
      messageData: {
        buttons: [{ text: 'Click me' }],
      },
    } as any);

    const result = hasButtons(message);
    expect(result).toBe(true);
  });

  it('должен возвращать false если buttons не массив', () => {
    const message = createTestMessage({
      messageData: {
        buttons: 'not-array',
      },
    } as any);

    const result = hasButtons(message);
    expect(result).toBe(false);
  });
});

describe('getButtons', () => {
  it('должен возвращать пустой массив для сообщения без messageData', () => {
    const message = createTestMessage({ messageData: null });

    const result = getButtons(message);
    expect(result).toEqual([]);
  });

  it('должен возвращать пустой массив для сообщения без кнопок', () => {
    const message = createTestMessage({ messageData: {} });

    const result = getButtons(message);
    expect(result).toEqual([]);
  });

  it('должен возвращать пустой массив если buttons не массив', () => {
    const message = createTestMessage({
      messageData: {
        buttons: 'not-array',
      },
    } as any);

    const result = getButtons(message);
    expect(result).toEqual([]);
  });

  it('должен возвращать массив кнопок', () => {
    const message = createTestMessage({
      messageData: {
        buttons: [{ text: 'Click me' }, { text: 'Another' }],
      },
    } as any);

    const result = getButtons(message);
    expect(result).toEqual([{ text: 'Click me' }, { text: 'Another' }]);
  });
});

describe('hasButtonClicked', () => {
  it('должен возвращать false для сообщения без messageData', () => {
    const message = createTestMessage({ messageData: null });

    const result = hasButtonClicked(message);
    expect(result).toBe(false);
  });

  it('должен возвращать false для сообщения без button_clicked', () => {
    const message = createTestMessage({ messageData: {} });

    const result = hasButtonClicked(message);
    expect(result).toBe(false);
  });

  it('должен возвращать false если button_clicked = false', () => {
    const message = createTestMessage({
      messageData: { button_clicked: false },
    } as any);

    const result = hasButtonClicked(message);
    expect(result).toBe(false);
  });

  it('должен возвращать true если button_clicked = true', () => {
    const message = createTestMessage({
      messageData: { button_clicked: true },
    } as any);

    const result = hasButtonClicked(message);
    expect(result).toBe(true);
  });
});

describe('getButtonText', () => {
  it('должен возвращать null для сообщения без messageData', () => {
    const message = createTestMessage({ messageData: null });

    const result = getButtonText(message);
    expect(result).toBeNull();
  });

  it('должен возвращать null для сообщения без button_text', () => {
    const message = createTestMessage({ messageData: {} });

    const result = getButtonText(message);
    expect(result).toBeNull();
  });

  it('должен возвращать форматированный текст кнопки', () => {
    const message = createTestMessage({
      messageData: { button_text: 'Нажата кнопка' },
    } as any);

    const result = getButtonText(message);
    expect(result).toBe('Нажата: Нажата кнопка');
  });

  it('должен возвращать null для пустого button_text', () => {
    const message = createTestMessage({
      messageData: { button_text: '' },
    } as any);

    const result = getButtonText(message);
    expect(result).toBeNull();
  });
});
