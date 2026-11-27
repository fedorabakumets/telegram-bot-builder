/** @fileoverview Регрессия формата и байтовых ограничений кнопок перехода в рассылках. */
import { describe, expect, it } from 'vitest';
import type { Button } from '@shared/schema';
import type { NewBroadcastFormData } from '../types';
import { validateBroadcastMessage } from './validate-broadcast-message';

/**
 * Создаёт заполненную форму с одной кнопкой перехода.
 * @param overrides - Переопределения полей кнопки
 * @returns Форма для проверки длины фактически отправляемого callback
 */
function form(overrides: Partial<Button>): NewBroadcastFormData {
  return {
    name: '', messageText: 'Сообщение', mediaUrls: [], tokenIds: [1],
    filters: { audienceType: 'all' },
    buttons: [{
      id: 'button', text: 'Открыть', action: 'goto', target: 'create-own-intro',
      buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
      ...overrides,
    }],
  };
}

describe('Длина перехода в сообщении рассылки', () => {
  it.each([
    ['а'.repeat(32), true],
    ['а'.repeat(33), false],
    ['a'.repeat(64), true],
    ['a'.repeat(65), false],
  ])('проверяет размер цели в UTF-8: %s', (target, allowed) => {
    const result = validateBroadcastMessage(form({ target }));
    expect(result.isValid).toBe(allowed);
    if (!allowed) expect(result.errors[0].message).toContain('callback_data слишком длинный');
  });

  it('проверяет пользовательский callback вместо длинной цели', () => {
    expect(validateBroadcastMessage(form({
      target: 'a'.repeat(65), customCallbackData: 'b'.repeat(64),
    })).isValid).toBe(true);
    expect(validateBroadcastMessage(form({
      target: 'short', customCallbackData: 'b'.repeat(65),
    })).isValid).toBe(false);
  });

  it('использует цель при пустом пользовательском callback', () => {
    expect(validateBroadcastMessage(form({
      target: 'a'.repeat(64), customCallbackData: '',
    })).isValid).toBe(true);
    expect(validateBroadcastMessage(form({
      target: 'a'.repeat(65), customCallbackData: '',
    })).isValid).toBe(false);
  });

  it.each(['', undefined])('проверяет ID кнопки при отсутствующей цели: %s', (target) => {
    expect(validateBroadcastMessage(form({ target, id: 'a'.repeat(64) })).isValid).toBe(true);
    expect(validateBroadcastMessage(form({ target, id: 'a'.repeat(65) })).isValid).toBe(false);
  });
});
