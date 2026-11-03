/** @fileoverview Проверяет сохранение настроек юзербота при разборе проекта. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nodeSchema } from './node-schema';

describe('настройки узлов юзербота', () => {
  const cases = [
    { type: 'userbot_message', data: { userbotEntity: '@chat', userbotRecipients: ['@chat'], responseStrategy: 'regex_match', responseFilterRegex: 'ok', responseWaitSeconds: 5, saveResponseTextTo: 'reply' } },
    { type: 'userbot_click_button', data: { userbotEntity: '@bot', messageId: '123', messageIdSource: 'manual', clickMode: 'data', clickDelivery: 'await', clickValue: 'next', saveAlertTo: 'alert', saveButtonsTo: 'buttons' } },
    { type: 'userbot_inline_query', data: { botUsername: '@bot', query: 'пример', targetChat: '@chat', sendToSameChat: false, resultIndex: '2', saveResultTitleTo: 'title' } },
    { type: 'userbot_edit_trigger', data: { userbotEntity: '@chat', filterType: 'regex', filterValue: 'ok', saveTextTo: 'text', saveChatIdTo: 'chat', saveSenderIdTo: 'sender' } },
  ];
  for (const { type, data } of cases) {
    it(`сохраняет заданные поля ${type}`, () => {
      const parsed = nodeSchema.parse({ id: 'node', type, position: { x: 0, y: 0 }, data });
      for (const [key, value] of Object.entries(data)) assert.deepEqual(Reflect.get(parsed.data, key), value);
    });
  }
});
