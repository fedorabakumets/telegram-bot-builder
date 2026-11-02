/** @fileoverview Проверки серверного писателя: общая транзакция, подтверждённые отправки и отсутствие ложных событий. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
import { createMessageWithAnalytics } from './create-message';
import type { db } from '../db';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
describe('Писатель сообщений Node', () => {
  it('сохраняет успешную отправку и один факт при повторном подтверждении', async () => {
    const connection = drizzle(database.pool) as typeof db;
    const input = { projectId: 1, tokenId: 11, userId: '42', messageType: 'bot', messageText: 'Ответ', telegramMessageId: 7, chatType: 'private' as const };
    await createMessageWithAnalytics(connection, input);
    await createMessageWithAnalytics(connection, input);
    const { rows } = await database.pool.query('SELECT * FROM analytics_events_v2');
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ event_key: 'msg_out:42:7', kind: 'message_out', directed: false });
    expect((await database.pool.query('SELECT * FROM analytics_audience_v2')).rowCount).toBe(0);
    expect((await database.pool.query('SELECT outgoing_count FROM message_activity_daily')).rows[0].outgoing_count).toBe('1');
    expect((await database.pool.query('SELECT COUNT(*) count FROM bot_messages')).rows[0].count).toBe('1');
  });
  it('не считает человека пользователем по неявному типу чата', async () => {
    const connection = drizzle(database.pool) as typeof db;
    await createMessageWithAnalytics(connection, { projectId: 1, tokenId: 11, userId: '100', messageType: 'user', telegramMessageId: 20 });
    expect((await database.pool.query("SELECT directed,chat_type FROM analytics_events_v2 WHERE user_id='100'")).rows[0]).toEqual({ directed: false, chat_type: 'unknown' });
    expect((await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='100'")).rowCount).toBe(0);
  });
  it('не сохраняет одноразовый код в тексте или вложенных данных диалога', async () => {
    const connection = drizzle(database.pool) as typeof db;
    await createMessageWithAnalytics(connection, { projectId: 1, tokenId: 11, userId: '101', messageType: 'user', telegramMessageId: 21,
      messageText: '/start link_secret_code', messageData: { nested: { url: 'https://t.me/bot?start=link_secret_code' } }, chatType: 'private' });
    const { rows } = await database.pool.query("SELECT message_text,message_data FROM bot_messages WHERE user_id='101'");
    expect(JSON.stringify(rows)).not.toContain('secret_code');
    expect(rows[0].message_text).toBe('/start link_[скрыто]');
  });
  it('ошибка новой аналитики откатывает и запись диалога', async () => {
    const connection = drizzle(database.pool) as typeof db;
    const before = (await database.pool.query('SELECT COUNT(*) count FROM bot_messages')).rows[0].count;
    await expect(createMessageWithAnalytics(connection, { projectId: 1, tokenId: 21, userId: '42', messageType: 'bot', telegramMessageId: 8 })).rejects.toThrow();
    expect((await database.pool.query('SELECT COUNT(*) count FROM bot_messages')).rows[0].count).toBe(before);
  });
});
