/** @fileoverview Проверяет, какие узлы блокируют перенос на общий Telegram-клиент. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unsupportedSharedTelegramNodes } from './project-telegram-scenario-compatibility';

test('до остановки ботов находит неподдерживаемые действия на всех листах', () => {
  const scenario = { sheets: [
    { nodes: [{ id: 'ordinary', type: 'userbot_message', data: { attachedMedia: [] } }] },
    { nodes: [
      { id: 'picture', type: 'userbot_message', data: { attachedMedia: ['example.jpg'] } },
      { id: 'event', type: 'userbot_edit_trigger', data: {} },
      { id: 'custom', type: 'code', data: { code: 'await userbot_client.get_me()' } },
    ] },
  ] };
  assert.deepEqual(unsupportedSharedTelegramNodes(scenario), ['picture', 'custom']);
});

test('поддерживает старый формат проекта и обычный код без Telegram', () => {
  assert.deepEqual(unsupportedSharedTelegramNodes({ nodes: [
    { id: 'custom', type: 'code', data: { code: 'value = 42' } },
    { id: 'inline', type: 'userbot_inline_query', data: {} },
  ] }), []);
});
