/** @fileoverview Проверка сохранения ссылки на отдельную клавиатуру при проверке узла. */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { nodeSchema } from './node-schema';

it('сохраняет ссылку на клавиатуру после проверки схемы', () => {
  const node = nodeSchema.parse({
    id: 'message_1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { keyboardNodeId: 'keyboard_1' },
  });
  assert.equal(node.data.keyboardNodeId, 'keyboard_1');
});

it('сохраняет настройки исключения пользователя после проверки схемы', () => {
  const node = nodeSchema.parse({
    id: 'kick_1', type: 'kick_user', position: { x: 0, y: 0 },
    data: { userIdSource: 'custom', userIdManual: '{target_user_id}' },
  });
  assert.equal(node.data.userIdSource, 'custom');
  assert.equal(node.data.userIdManual, '{target_user_id}');
});
