/** @fileoverview Проверка сохранности введённого текста при исчезновении строки из окна таблицы. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCellDraftStore } from './cell-draft-store';

test('Черновик и ошибка сохраняются после отписки строки и повторного появления', () => {
  const store = createCellDraftStore();
  store.get('1:2', 'Исходное');
  let notifications = 0;
  const stop = store.subscribe('1:2', () => notifications++);
  store.patch('1:2', { draft: 'Мой текст', error: 'Конфликт' }); stop();
  const draft = store.get('1:2', 'Свежее с сервера');
  assert.equal(draft.draft, 'Мой текст'); assert.equal(draft.baseline, 'Исходное'); assert.equal(draft.error, 'Конфликт'); assert.equal(notifications, 1);
});
