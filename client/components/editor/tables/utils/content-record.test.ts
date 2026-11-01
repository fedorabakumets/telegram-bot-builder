/** @fileoverview Проверки связи строк контента с нодами, кнопками и удалёнными записями. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CanvasSheet } from '@shared/schema';
import { describeContent } from './content-record';
/** Тестовые листы с точками в идентификаторах и пользовательскими именами. */
const sheets = [{ id: 'sheet', name: 'Главная', nodes: [
  { id: 'message.with.dots', type: 'message', data: { label: 'Приветствие', messageText: '<b>Здравствуйте</b>' } },
  { id: 'message.with.dots.desc', type: 'message', data: { messageText: 'Точный ID имеет приоритет' } },
  { id: 'command', type: 'command_trigger', data: {} },
] }] as unknown as CanvasSheet[];

test('Ссылка кнопки принадлежит ноде с полным исходным ID', () => {
  const record = describeContent('message.with.dots.btn.buy.url', sheets);
  assert.equal(record.nodeId, 'message.with.dots');
  assert.equal(record.buttonId, 'buy');
  assert.equal(record.title, 'Приветствие');
  assert.equal(record.field, 'Ссылка кнопки');
  assert.equal(record.missing, false);
});
test('Точное совпадение ID важнее похожего суффикса поля', () => {
  const record = describeContent('message.with.dots.desc', sheets);
  assert.equal(record.nodeId, 'message.with.dots.desc');
  assert.equal(record.field, 'Текст сообщения');
});
test('Описание команды получает понятное назначение', () => {
  const record = describeContent('command.desc', sheets);
  assert.equal(record.title, 'Команда');
  assert.equal(record.field, 'Описание команды');
});
test('Удалённая нода отмечается без подмены её ID', () => {
  const record = describeContent('deleted.node.btn.buy.webapp', sheets);
  assert.equal(record.nodeId, 'deleted.node');
  assert.equal(record.field, 'Приложение кнопки');
  assert.equal(record.missing, true);
});
test('Отсутствие загруженного сценария отличается от удалённой ноды', () => {
  const record = describeContent('loading.api');
  assert.equal(record.loading, true);
  assert.equal(record.missing, false);
});
