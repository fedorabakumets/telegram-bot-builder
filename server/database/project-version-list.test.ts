/** @fileoverview Проверки проекции истории, границ страниц и точности курсоров. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PgDialect } from 'drizzle-orm/pg-core';
import { decodeVersionCursor, selectProjectVersionList, versionMetadataColumns, versionPageCondition } from './project-version-list';

/** Создаёт курсор с микросекундами PostgreSQL. */
function cursor(projectId = 7, timestamp: string | null = '2026-11-10 12:00:00.123456', id = 3) {
  return Buffer.from(JSON.stringify({ projectId, timestamp, id })).toString('base64url');
}

/** Подставляет цепочку запросов и проверяет реально выбранные поля. */
function databaseStub(rows: object[]) {
  const calls: { fields: object; limit?: number }[] = [];
  const database = { select(fields: object) {
    const entry = { fields } as { fields: object; limit?: number };
    calls.push(entry);
    const result = 'total' in fields ? [{ total: 3 }] : rows;
    const chain = { from() { return chain; }, where() { return chain; }, orderBy() { return chain; },
      limit(limit: number) { entry.limit = limit; return Promise.resolve(result); },
      then(resolve: (value: object[]) => unknown) { return Promise.resolve(result).then(resolve); } };
    return chain;
  } };
  return { database: database as unknown as Parameters<typeof selectProjectVersionList>[0], calls };
}

test('список исключает snapshot на уровне SQL-проекции и сохраняет старый массив', async () => {
  assert.equal('snapshot' in versionMetadataColumns, false);
  const { database, calls } = databaseStub([{ id: 3, projectId: 7, cursorTimestamp: null }]);
  const result = await selectProjectVersionList(database, 7);
  assert.deepEqual(result, [{ id: 3, projectId: 7 }]);
  assert.equal('snapshot' in calls[0].fields, false);
  assert.equal(calls.length, 1);
});

test('страница выбирает limit+1 и возвращает точный курсор последней видимой записи', async () => {
  const timestamp = '2026-11-10 12:00:00.123456';
  const { database, calls } = databaseStub([{ id: 3, cursorTimestamp: timestamp }, { id: 2, cursorTimestamp: timestamp }]);
  const result = await selectProjectVersionList(database, 7, { limit: 1 });
  assert.ok(!Array.isArray(result));
  assert.equal(calls[0].limit, 2);
  assert.equal(result.total, 3);
  assert.deepEqual(result.items, [{ id: 3 }]);
  assert.ok(result.nextCursor);
  assert.deepEqual(decodeVersionCursor(result.nextCursor, 7), { projectId: 7, id: 3, timestamp });
});

test('последняя страница не выдаёт следующий курсор', async () => {
  const { database } = databaseStub([]);
  const result = await selectProjectVersionList(database, 7, { limit: 20 });
  assert.ok(!Array.isArray(result));
  assert.equal(result.nextCursor, null);
});

test('курсор проверяет область проекта, формат и ID', () => {
  for (const value of ['oops', cursor(8), cursor(7, 'bad'), cursor(7, '2026-99-99 99:99:99'), cursor(7, '2026-02-30 12:00:00'), cursor(7, null, -1)]) {
    assert.throws(() => decodeVersionCursor(value, 7));
  }
  assert.equal(decodeVersionCursor(cursor(), 7).timestamp, '2026-11-10 12:00:00.123456');
});

test('SQL учитывает микросекунды, совпадения дат, NULL и область проекта', () => {
  const dialect = new PgDialect();
  const query = dialect.sqlToQuery(versionPageCondition(7, cursor())!);
  assert.match(query.sql, /created_at.*id.*<.*::timestamp/s);
  assert.ok(query.params.includes('2026-11-10 12:00:00.123456'));
  assert.equal(query.params[0], 7);
  const nullable = dialect.sqlToQuery(versionPageCondition(7, cursor(7, null))!);
  assert.match(nullable.sql, /created_at.*is null.*id.*</s);
});

test('хранилище отклоняет неограниченные страницы', async () => {
  const { database, calls } = databaseStub([]);
  for (const limit of [0, -1, 101, 1.5, NaN]) {
    await assert.rejects(selectProjectVersionList(database, 7, { limit }));
  }
  assert.equal(calls.length, 0);
});
