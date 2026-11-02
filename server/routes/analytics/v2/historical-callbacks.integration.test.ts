/** @fileoverview Проверка счётчика сохранённых нажатий и границ периода. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
import { seedLegacyEvidence } from '../../../database/analytics-v2/evidence-test-helpers';
import { backfillAudienceEvidenceBatch } from '../../../database/analytics-v2/evidence-backfill';

const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());

it('разделяет старые и подтверждённые нажатия по боту и границам текущего и предыдущего окна', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    await seedLegacyEvidence(client, '100', 11, '2026-10-10T00:00:00Z');
    await seedLegacyEvidence(client, '101', 11, '2026-10-20T00:00:00Z');
    const last = await seedLegacyEvidence(client, '102', 11, '2026-10-30T00:00:00Z');
    await backfillAudienceEvidenceBatch(client, last);
    const other = await seedLegacyEvidence(client, '103', 12, '2026-10-20T00:00:00Z');
    await backfillAudienceEvidenceBatch(client, other);
    const event = { project_id: 1, token_id: 11, event_key: 'cb:991', kind: 'callback', user_id: '101', chat_id: '101',
      chat_type: 'private', directed: true, occurred_at: '2026-10-20T00:00:00Z' };
    await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    const query = { from: '2026-10-20T00:00:00Z', to: '2026-10-30T00:00:00Z', comparison: 'previous' };
    const one = await readAnalyticsV2Snapshot(client, 1, 11, query);
    expect(one.current.messages).toMatchObject({ callbacks: 1, historical_callbacks: 1, total: 0 });
    expect(one.current.messages.chat_scopes.private).toMatchObject({ callbacks: 1, historical_callbacks: 0 });
    expect(one.current.messages.chat_scopes.group).toMatchObject({ callbacks: 0, historical_callbacks: 1 });
    expect(one.previous?.messages).toMatchObject({ callbacks: 0, historical_callbacks: 1 });
    const all = await readAnalyticsV2Snapshot(client, 1, null, query);
    expect(all.current.messages).toMatchObject({ callbacks: 1, historical_callbacks: 2, total: 0 });
    expect((await readAnalyticsV2Snapshot(client, 2, null, query)).current.messages.historical_callbacks).toBe(0);
    const partial = await readAnalyticsV2Snapshot(client, 1, null, {
      from: '2026-10-19T12:00:00Z', to: '2026-10-30T00:00:00Z', step: '1d', timezone: 'Europe/Berlin',
    });
    expect(partial.points.reduce((sum, point) => sum + point.historical_callbacks, 0)).toBe(2);
    expect(partial.points.reduce((sum, point) => sum + point.callbacks, 0)).toBe(1);
    expect(partial.points.find(point => point.historical_callbacks === 2)?.callbacks).toBe(1);
    expect(partial.points.some(point => point.historical_callbacks === 0 && point.callbacks === 0)).toBe(true);
    expect(partial.points.reduce((sum, point) => sum + point.historical_callbacks, 0)).toBe(partial.current.messages.historical_callbacks);
    expect(partial.points.some(point => Date.parse(point.end_date!) - Date.parse(point.date) === 25 * 3600000)).toBe(true);
    expect(partial.points.reduce((sum, point) => sum + point.chat_scopes.group.historical_callbacks, 0)).toBe(2);
    expect(partial.points.reduce((sum, point) => sum + point.chat_scopes.private.callbacks, 0)).toBe(1);
  } finally { await client.query('ROLLBACK'); client.release(); }
});

it('дедуплицирует общее групповое сообщение и учитывает направленный экземпляр в нужном периоде', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    for (const [token_id, directed] of [[11, false], [12, true]] as const) {
      const event = { project_id: 1, token_id, event_key: 'msg:-100:901', kind: 'message_in', user_id: '100',
        chat_id: '-100', chat_type: 'supergroup', directed, occurred_at: '2026-10-20T12:00:00Z' };
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    }
    const query = { from: '2026-10-20T00:00:00Z', to: '2026-10-21T00:00:00Z', comparison: 'previous' };
    const all = await readAnalyticsV2Snapshot(client, 1, null, query);
    expect(all.current.messages).toMatchObject({ incoming: 1, incoming_to_bot: 1 });
    expect(all.points.reduce((sum, point) => sum + point.incoming_to_bot, 0)).toBe(1);
    expect(all.previous?.messages.incoming_to_bot).toBe(0);
    expect((await readAnalyticsV2Snapshot(client, 1, 11, query)).current.messages.incoming_to_bot).toBe(0);
    expect((await readAnalyticsV2Snapshot(client, 1, 12, query)).current.messages.incoming_to_bot).toBe(1);
  } finally { await client.query('ROLLBACK'); client.release(); }
});

it('разделяет личные и групповые сообщения, сохраняя неизвестные и каналы только в общих значениях', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, chat_type, kind, directed] of [[1, 'private', 'message_in', true], [2, 'group', 'message_in', true],
      [3, 'supergroup', 'message_out', true], [4, 'unknown', 'message_in', true], [5, 'channel', 'message_out', true],
      [6, 'group', 'message_in', false]] as const) {
      const event = { project_id: 1, token_id: 11, event_key: `scope:${index}`, kind, user_id: '100', chat_id: '100',
        chat_type, directed, occurred_at: '2026-10-20T12:00:00Z' };
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    }
    const value = await readAnalyticsV2Snapshot(client, 1, 11, { from: '2026-10-20T10:00:00Z', to: '2026-10-21T10:00:00Z', step: '1h' });
    expect(value.current.messages).toMatchObject({ incoming: 4, incoming_to_bot: 2, outgoing: 2, total: 6,
      chat_scopes: { private: { incoming: 1, incoming_to_bot: 1, outgoing: 0 }, group: { incoming: 2, incoming_to_bot: 1, outgoing: 1 } } });
    expect(value.points.reduce((sum, point) => sum + point.chat_scopes.private.incoming_to_bot, 0)).toBe(1);
    expect(value.points.reduce((sum, point) => sum + point.chat_scopes.group.incoming_to_bot, 0)).toBe(1);
    expect(value.points.reduce((sum, point) => sum + point.chat_scopes.group.outgoing, 0)).toBe(1);
    expect(value.points.reduce((sum, point) => sum + point.incoming, 0)).toBe(4);
    expect(value.points.reduce((sum, point) => sum + point.incoming_to_bot, 0)).toBe(2);
  } finally { await client.query('ROLLBACK'); client.release(); }
});
