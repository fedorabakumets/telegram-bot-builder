/** @fileoverview Проверка области и порядка соседей сообщения в общей истории ботов. */
import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => ({ queries: [] as unknown[], result: [] as unknown[][] }));
vi.mock('../../../../database/db', () => ({ db: { select: () => {
  /** Возвращает цепочку чтения Drizzle без реального подключения. */
  const chain = { from: () => chain, where: (scope: unknown) => { mocks.queries.push(scope); return chain; },
    orderBy: () => chain, limit: () => Promise.resolve(mocks.result.shift() ?? []) };
  return chain;
} } }));
import { getMessageContext } from './get-message-context';

beforeEach(() => { mocks.queries.length = 0; mocks.result.length = 0; });

it('не накладывает токен по умолчанию, но ограничивает всех соседей проектом, человеком и приватностью', async () => {
  const target = { id: 12, createdAt: new Date('2026-11-17T09:00:00Z'), tokenId: 8 };
  mocks.result.push([target], [{ id: 10 }], [{ id: 13 }]);
  const result = await getMessageContext(7, null, '15', 12, false, false);
  expect(result?.map(message => message.id)).toEqual([10, 12, 13]);
  const compiled = mocks.queries.map(scope => new PgDialect().sqlToQuery(scope as Parameters<PgDialect['sqlToQuery']>[0]));
  for (const query of compiled) {
    expect(query.sql).toContain('"bot_messages"."project_id"');
    expect(query.sql).toContain('"bot_messages"."user_id"');
    expect(query.sql).toContain("COALESCE(\"bot_messages\".\"chat_type\", 'private') = 'private'");
    expect(query.sql).not.toContain('"bot_messages"."token_id"');
    expect(query.params).toEqual(expect.arrayContaining([7, '15']));
  }
  expect(compiled[1].sql).toContain(' < ');
  expect(compiled[2].sql).toContain(' > ');
});

it('возвращает отсутствие контекста, если цель не найдена в выбранной области', async () => {
  mocks.result.push([]);
  expect(await getMessageContext(7, 8, '15', 12)).toBeNull();
  expect(mocks.queries).toHaveLength(1);
});
