/** @fileoverview Проверки сохранения настроек узлов после проверки схемы. */
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

it('сохраняет настройки задержки после проверки схемы', () => {
  const node = nodeSchema.parse({
    id: 'delay_1', type: 'delay', position: { x: 0, y: 0 },
    data: { seconds: '{timeout}', unit: 'minutes', mode: 'background' },
  });
  assert.deepEqual([node.data.seconds, node.data.unit, node.data.mode], ['{timeout}', 'minutes', 'background']);
});

it('сохраняет источник подключения SQL-узла после проверки схемы', () => {
  const node = nodeSchema.parse({
    id: 'sql_1', type: 'psql_query', position: { x: 0, y: 0 },
    data: { connectionSource: 'env', connectionEnvVar: 'BOT_DATABASE_URL' },
  });
  assert.equal(node.data.connectionSource, 'env');
  assert.equal(node.data.connectionEnvVar, 'BOT_DATABASE_URL');
});

it('сохраняет настройки deep link, извлечения ответа и цвета заметки', () => {
  const base = { id: 'node', position: { x: 0, y: 0 } };
  const command = nodeSchema.parse({ ...base, type: 'command_trigger', data: {
    deepLinkParam: 'ref_', deepLinkMatchMode: 'startsWith', deepLinkSaveToVar: true, deepLinkVarName: 'ref',
  } });
  const request = nodeSchema.parse({ ...base, type: 'http_request', data: {
    httpRequestResponseJsonPath: 'data.items.0', httpRequestResponseExtractTo: 'item',
  } });
  const comment = nodeSchema.parse({ ...base, type: 'comment', data: { commentColor: 'blue' } });
  assert.equal(command.data.deepLinkMatchMode, 'startsWith');
  assert.equal(command.data.deepLinkParam, 'ref_');
  assert.equal(command.data.deepLinkSaveToVar, true);
  assert.equal(command.data.deepLinkVarName, 'ref');
  assert.equal(request.data.httpRequestResponseJsonPath, 'data.items.0');
  assert.equal(request.data.httpRequestResponseExtractTo, 'item');
  assert.equal(comment.data.commentColor, 'blue');
});
