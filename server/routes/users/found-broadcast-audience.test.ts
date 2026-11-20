/** @fileoverview Снимок получателей использует исходную область и возвращает только идентификаторы. */
import { expect, it } from 'vitest';
import { foundBroadcastAudienceSql } from './found-broadcast-audience';

it('сохраняет условия и исключает неотображаемые записи без переписки', () => {
  const selection = 'SELECT u.user_id AS "userId", lm.created_at AS "lastMessageAt" FROM bot_users u WHERE u.project_id=$1 AND u.token_id=$2';
  const sql = foundBroadcastAudienceSql(selection);
  expect(sql).toContain(selection);
  expect(sql).toContain('SELECT DISTINCT audience."userId"');
  expect(sql).toContain('WHERE audience."lastMessageAt" IS NOT NULL');
  expect(sql).toContain('LIMIT 10001');
  expect(sql).not.toContain('OFFSET');
});
