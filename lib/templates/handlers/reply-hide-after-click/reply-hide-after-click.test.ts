/**
 * @fileoverview Тесты для reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.test
 */

import { describe, it, expect } from 'vitest';
import { generateReplyHideAfterClick } from './reply-hide-after-click.renderer';
import {
  replyHideAfterClickFixture,
  noHideAfterClickFixture,
  multipleHideAfterClickFixture,
} from './reply-hide-after-click.fixture';

describe('generateReplyHideAfterClick', () => {
  it('должен генерировать код для кнопок с hideAfterClick', () => {
    const result = generateReplyHideAfterClick(replyHideAfterClickFixture);
    
    expect(result).toContain('hideAfterClick');
    expect(result).toContain('message_text_lower = message.text.lower()');
    expect(result).toContain('await bot.delete_message');
    expect(result).toContain('🗑️ Сообщение пользователя удалено');
  });

  it('должен генерировать пустую строку если нет кнопок с hideAfterClick', () => {
    const result = generateReplyHideAfterClick(noHideAfterClickFixture);
    
    expect(result).toBe('');
  });

  it('должен генерировать код для нескольких кнопок hideAfterClick', () => {
    const result = generateReplyHideAfterClick(multipleHideAfterClickFixture);
    
    expect(result).toContain('"удалить 1"');
    expect(result).toContain('"удалить 2"');
    expect(result).toContain('hide_after_click_texts');
  });

  it('должен содержать обработку исключений', () => {
    const result = generateReplyHideAfterClick(replyHideAfterClickFixture);
    
    expect(result).toContain('except Exception as e');
    expect(result).toContain('Не удалось удалить сообщение');
  });
});
