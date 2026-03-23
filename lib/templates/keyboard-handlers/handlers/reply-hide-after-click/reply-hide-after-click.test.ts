/**
 * @fileoverview Тесты для reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateReplyHideAfterClick } from './reply-hide-after-click.renderer';
import {
  replyHideAfterClickFixture,
  noHideAfterClickFixture,
  multipleHideAfterClickFixture,
} from './reply-hide-after-click.fixture';

describe('generateReplyHideAfterClick', () => {
  it('должен генерировать код для кнопок с hideAfterClick', () => {
    const result = generateReplyHideAfterClick(replyHideAfterClickFixture);

    assert.ok(result.includes('hideAfterClick'));
    assert.ok(result.includes('message_text_lower = message.text.lower()'));
    assert.ok(result.includes('await bot.delete_message'));
    assert.ok(result.includes('🗑️ Сообщение пользователя удалено'));
  });

  it('должен генерировать пустую строку если нет кнопок с hideAfterClick', () => {
    const result = generateReplyHideAfterClick(noHideAfterClickFixture);

    assert.strictEqual(result, '');
  });

  it('должен генерировать код для нескольких кнопок hideAfterClick', () => {
    const result = generateReplyHideAfterClick(multipleHideAfterClickFixture);

    assert.ok(result.includes('"удалить 1"'));
    assert.ok(result.includes('"удалить 2"'));
    assert.ok(result.includes('hide_after_click_texts'));
  });

  it('должен содержать обработку исключений', () => {
    const result = generateReplyHideAfterClick(replyHideAfterClickFixture);

    assert.ok(result.includes('except Exception as e'));
    assert.ok(result.includes('Не удалось удалить сообщение'));
  });
});
