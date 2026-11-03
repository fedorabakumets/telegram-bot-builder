/** @fileoverview Проверка семи совместимых Swagger-контрактов повторяемых записей таблиц. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildOfflineDocument } from './build-offline-document';
import { DURABLE_TABLE_PATHS, TableCompletedReceiptSchema, TableUnknownReceiptSchema } from './durable-table-contracts';

test('Все семь обёрнутых POST объявляют UUID, обе формы успеха, unknown и конфликт', () => {
  const document = buildOfflineDocument();
  for (const path of DURABLE_TABLE_PATHS) {
    const operation = document.paths[path].post;
    const body = JSON.stringify(operation.requestBody);
    assert.match(body, /requestId/);
    const status = operation.responses['201'] ? '201' : '200';
    const success = operation.responses[status];
    assert.match(JSON.stringify(success), /TableCompletedReceipt/);
    if (path.endsWith('/rows') || path.endsWith('/rows/import')) assert.ok(success.headers['x-botcraft-persistence']);
    assert.match(JSON.stringify(operation.responses['202']), /TableUnknownReceipt/);
    assert.ok(operation.responses['409'].content['application/json'].schema);
    assert.ok(operation.responses['503'].content['application/json'].schema);
  }
  const registrations = fs.readFileSync('server/routes/tables/setupTablesRoutes.ts', 'utf8');
  assert.equal([...registrations.matchAll(/durableTableWrite\("/g)].length, DURABLE_TABLE_PATHS.length);
});
test('Квитанция не принимает данные ячеек вместо ID, unknown запрещает автоматический повтор', () => {
  const requestId = '85f7291e-bb1e-48f9-a210-4490c4f30b18';
  assert.ok(TableCompletedReceiptSchema.safeParse({ requestId, state: 'completed', receipt: { ids: [1, 2], idsTruncated: false } }).success);
  assert.equal(TableCompletedReceiptSchema.safeParse({ requestId, state: 'completed', receipt: { ids: ['secret'], idsTruncated: false } }).success, false);
  assert.ok(TableUnknownReceiptSchema.safeParse({ requestId, state: 'unknown', retryable: false, receipt: null, message: 'Нужна сверка' }).success);
  assert.equal(TableUnknownReceiptSchema.safeParse({ requestId, state: 'unknown', retryable: true, receipt: null, message: 'Повторить' }).success, false);
});
