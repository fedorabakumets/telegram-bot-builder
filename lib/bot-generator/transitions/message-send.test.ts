/** @fileoverview Проверка генерации отправки сообщений для старых вызовов переходов. */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { generateFallbackNode } from './generate-fallback-node';
import { generateInlineKeyboardSend } from './generate-inline-keyboard-send';
import { generateReplyKeyboardSend } from './generate-reply-keyboard-send';

it('формирует корректную строку и отправку для трёх вариантов сообщения', () => {
  const node = {
    id: 'message_1',
    data: {
      messageText: 'Привет "мир"',
      buttons: [{ id: 'button_1', text: 'Далее', action: 'goto', target: 'next' }],
      resizeKeyboard: true,
      oneTimeKeyboard: false,
    },
  };
  for (const generate of [generateFallbackNode, generateInlineKeyboardSend, generateReplyKeyboardSend]) {
    const code = generate(node, '    ');
    assert.ok(code.includes('Привет \\"мир\\"'));
    assert.ok(code.includes('await fake_message.answer('));
  }
});
