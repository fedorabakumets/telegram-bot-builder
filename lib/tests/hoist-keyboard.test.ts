/**
 * @fileoverview Юнит-тест авто-выноса инлайн-клавиатур message-нод (hoistMessageKeyboards).
 * @description Проверяет: вынос кнопок message с keyboardType:'inline' в отдельную
 * keyboard-ноду, очистку message (buttons:[], keyboardType:'none', keyboardNodeId),
 * идемпотентность (повторный вызов не плодит дубли), а также неблокирующий warning
 * валидации inline_keyboard_will_hoist.
 * @module lib/tests/hoist-keyboard.test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Node } from '@shared/schema';
import { hoistMessageKeyboards } from '../bot-tools/hoist-keyboard.ts';
import { validateBotProject } from '../bot-tools/validate-project.ts';

/** Создаёт message-ноду с инлайн-кнопками для тестов */
function makeMessageWithInlineButtons(): Node {
  return {
    id: 'msg1',
    type: 'message',
    position: { x: 100, y: 200 },
    data: {
      messageText: 'Привет',
      keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: '' }],
    },
  } as unknown as Node;
}

test('hoistMessageKeyboards выносит инлайн-кнопки в keyboard-ноду', () => {
  const result = hoistMessageKeyboards([makeMessageWithInlineButtons()]);

  assert.equal(result.length, 2, 'появилась отдельная keyboard-нода');

  const msg = result.find((n) => n.id === 'msg1')!;
  const msgData = msg.data as Record<string, unknown>;
  assert.equal(msgData.keyboardType, 'none', 'message: keyboardType стал none');
  assert.deepEqual(msgData.buttons, [], 'message: buttons очищены');
  assert.ok(typeof msgData.keyboardNodeId === 'string', 'message: проставлен keyboardNodeId');

  const keyboard = result.find((n) => n.type === 'keyboard')!;
  assert.equal(keyboard.id, msgData.keyboardNodeId, 'keyboard.id совпадает с keyboardNodeId');
  const kbData = keyboard.data as Record<string, unknown>;
  assert.equal(kbData.keyboardType, 'inline', 'keyboard сохранил тип inline');
  assert.equal((kbData.buttons as unknown[]).length, 1, 'кнопки перенесены в keyboard');
  assert.equal(keyboard.position.x, 100 + 360, 'keyboard смещена +360 по x');
});

test('hoistMessageKeyboards идемпотентна — повторный вызов не плодит дубли', () => {
  const once = hoistMessageKeyboards([makeMessageWithInlineButtons()]);
  const twice = hoistMessageKeyboards(once);
  assert.equal(twice.length, once.length, 'повторный вызов не добавил новых нод');
  assert.equal(twice.filter((n) => n.type === 'keyboard').length, 1, 'ровно одна keyboard-нода');
});

test('hoistMessageKeyboards не трогает message без кнопок и с keyboardType none', () => {
  const plain: Node = {
    id: 'msg2',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Без кнопок', keyboardType: 'none', buttons: [] },
  } as unknown as Node;
  const result = hoistMessageKeyboards([plain]);
  assert.equal(result.length, 1, 'новых нод не появилось');
});

test('валидация выдаёт неблокирующий warning inline_keyboard_will_hoist', () => {
  const project = {
    version: 2,
    sheets: [{ id: 's1', name: 'Лист 1', nodes: [makeMessageWithInlineButtons()] }],
  };
  const res = validateBotProject(project);
  const warn = res.issues.find((i) => i.code === 'inline_keyboard_will_hoist');
  assert.ok(warn, 'warning присутствует');
  assert.equal(warn!.severity, 'warning', 'именно warning, не error');
  assert.equal(res.valid, true, 'warning не ломает валидацию');
});
