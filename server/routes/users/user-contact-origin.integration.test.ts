/** @fileoverview Проверки классификации контактов и очереди личных чатов в изолированной схеме PostgreSQL. */
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { createImportTestDatabase } from './import-users-test-database';
import { confirmedPrivateContactSql, userContactOriginSql, firstSavedMessageSql } from './user-contact-origin-sql';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query: mocks.query } }));
import { listPrivateUserIds } from '../dialogs/chat-access-check-audience';
const database = createImportTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`ALTER TABLE bot_messages ADD COLUMN message_type text,ADD COLUMN chat_id text,ADD COLUMN created_at timestamp;
    CREATE TABLE analytics_events_v2(project_id integer,token_id integer,user_id text,kind text,chat_type text,directed boolean,occurred_at timestamptz);
    CREATE TABLE analytics_audience_evidence_v2(project_id integer,token_id integer,user_id text,reason text,chat_type text,observed_at timestamptz);
    INSERT INTO bot_users(project_id,token_id,user_id,is_bot,imported_at) VALUES
      (1,11,100,0,NULL),(1,11,101,0,NULL),(1,11,102,0,NULL),(1,11,103,0,now()),(1,11,104,0,NULL),(1,12,100,0,NULL),(2,11,100,0,NULL);
    INSERT INTO bot_messages VALUES
      (1,11,'100','private','bot','100','2026-10-21 12:00:00'),
      (1,11,'101','private','user','101','2026-10-20 12:00:00'),
      (1,11,'102','private','system','102','2026-10-20 12:00:00'),
      (1,12,'100','private','user','100','2026-10-22 12:00:00'),
      (2,11,'100','private','user','100','2026-10-01 12:00:00');
    INSERT INTO analytics_events_v2 VALUES
      (1,11,'100','message_in','supergroup',false,'2026-10-19T12:00:00Z'),
      (1,11,'104','callback','private',true,'2026-10-20T13:00:00Z');`);
  mocks.query.mockImplementation((...args: any[]) => database.pool.query(args[0], args[1]));
});
afterAll(() => database.cleanup());
/** Читает контакт только в выбранной области ботов проекта. */
async function contacts(token: number | null) {
  return (await database.pool.query(`SELECT u.user_id::text id,${userContactOriginSql('u',true)} origin,
    ${firstSavedMessageSql('u',true)} first_at,${confirmedPrivateContactSql('u',true)} confirmed FROM bot_users u
    WHERE u.project_id=$1 AND u.token_id=11 ORDER BY u.user_id`, [1,token])).rows;
}
it('отделяет групповую историю, импорт и системную запись от личного обращения', async () => {
  const rows = await contacts(11);
  expect(rows.map(row => [row.id,row.origin,row.confirmed])).toEqual([
    ['100','group_history',false],['101','private',true],['102','unknown',false],['103','imported',false],['104','private',true],
  ]);
  expect(rows[0].first_at.toISOString()).toBe('2026-10-19T12:00:00.000Z');
  expect(rows[2].first_at).toBeNull();
});
it('в сводной строке учитывает другой бот, сохраняя первую дату группы', async () => {
  const rows = await contacts(null);
  expect(rows[0].origin).toBe('private');
  expect(rows[0].first_at.toISOString()).toBe('2026-10-19T12:00:00.000Z');
});
it('очередь пропускает исходящие, импорт и системы, включая подтверждённое нажатие', async () => {
  expect(await listPrivateUserIds(1,11)).toEqual(['101','104']);
  expect(await listPrivateUserIds(1,12)).toEqual(['100']);
});
