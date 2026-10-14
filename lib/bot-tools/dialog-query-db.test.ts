/** @fileoverview Проверка SQL диалогов в временных таблицах локального PostgreSQL. */
import 'dotenv/config';
import { Client } from 'pg';
import { expect, it, vi } from 'vitest';
import { DIALOG_QUERY } from '../../server/routes/dialogs/dialog-query';
import { buildDialogListQuery } from '../../server/routes/dialogs/dialog-list-query';
import { dialogParams, encodeDialogCursor } from '../../server/routes/dialogs/dialog-pagination';
import { CHAT_ACCESS_DDL } from '../../server/database/ensure-chat-access';
vi.mock('../../server/database/db', () => ({ db: {} }));

it('изолирует историю ботов, сохраняет пустые диалоги и отделяет отправителя группы', async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname)) {
    throw new Error('Для проверки требуется локальный PostgreSQL');
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TEMP TABLE bot_users (user_id text, project_id int, token_id int,
      is_bot int, first_name text, last_name text, username text, last_interaction timestamptz);
      CREATE TEMP TABLE bot_messages (id int, project_id int, token_id int, user_id text, chat_id text,
      chat_type text, message_text text, message_type text, created_at timestamptz);
      CREATE TEMP TABLE bot_groups (id int, project_id int, token_id int, group_id text, name text, url text, avatar_url text);
      CREATE TEMP TABLE chat_access (project_id int, token_id int, chat_id text, status text, checked_at timestamptz);
      INSERT INTO bot_users VALUES ('1',12,9,0,'Иван',NULL,'ivan','2026-10-13'),
      ('2',12,9,0,'Без сообщений',NULL,NULL,NULL),('3',12,9,1,'Бот',NULL,NULL,NULL),
      ('1',12,10,0,'Другой бот',NULL,NULL,'2026-10-14');
      INSERT INTO bot_messages VALUES (1,12,9,'1',NULL,'private','Привет','user','2026-10-13'),
      (2,12,10,'1',NULL,'private','Чужой текст','user','2026-10-14'),
      (3,12,9,'1','-1001','supergroup','В группе','user','2026-10-13'),
      (4,12,9,'1','-1001','supergroup','Ответ','bot','2026-10-13 01:00'),
      (5,13,9,'1',NULL,'private','Другой проект','user','2026-10-15');
      INSERT INTO bot_groups VALUES (1,12,9,'-1001','Наша группа','https://t.me/our_group',NULL),
      (2,12,10,'-1001','Чужая группа','',NULL);
      INSERT INTO chat_access VALUES (12,9,'-1001','kicked',now());`);
    const rows = (await client.query(DIALOG_QUERY, [12, 9])).rows;
    expect(rows).toHaveLength(3);
    const personal = rows.find((row) => row.chat_id === '1');
    expect(personal.retained_message_count).toBe(1);
    expect(personal.last_message.preview).toBe('Привет');
    expect(personal.access_status).toBe('unknown');
    const empty = rows.find((row) => row.chat_id === '2');
    expect(empty.last_message).toBeNull();
    expect(empty.retained_message_count).toBe(0);
    const group = rows.find((row) => row.chat_id === '-1001');
    expect(group.title).toBe('Наша группа');
    expect(group.username).toBe('our_group');
    expect(group.retained_message_count).toBe(2);
    expect(group.last_message.direction).toBe('outgoing');
    expect(group.access_status).toBe('kicked');
    for (const [kind, count] of [['all', 3], ['users', 2], ['groups', 1], ['channels', 0]] as const) {
      const query = buildDialogListQuery(12, dialogParams.parse({ tokenId: 9, kind }));
      expect((await client.query(query.sql, query.values)).rows).toHaveLength(count);
    }
    for (const search of ['наша', 'OUR_GROUP', '-1001']) {
      const query = buildDialogListQuery(12, dialogParams.parse({ tokenId: 9, search }));
      expect((await client.query(query.sql, query.values)).rows).toHaveLength(1);
    }
    await client.query("UPDATE bot_users SET last_interaction = '2026-10-13 01:00' WHERE user_id = '1' AND token_id = 9");
    const query = buildDialogListQuery(12, dialogParams.parse({ tokenId: 9, limit: 1 }));
    const sorted = (await client.query(query.sql, query.values)).rows;
    const first = sorted[0];
    const cursor = encodeDialogCursor({ scope: query.scope,
      time: new Date(first.last_activity_at).toISOString(), type: first.chat_type, id: first.chat_id });
    const next = buildDialogListQuery(12, dialogParams.parse({ tokenId: 9, limit: 1, cursor }));
    const rest = (await client.query(next.sql, next.values)).rows;
    expect(rest.map((row) => row.chat_id)).not.toContain(first.chat_id);
    expect(rest).toHaveLength(2);
    const final = buildDialogListQuery(12, dialogParams.parse({ tokenId: 9, limit: 1,
      cursor: encodeDialogCursor({ scope: query.scope, time: null, type: 'private', id: '2' }) }));
    expect((await client.query(final.sql, final.values)).rows).toHaveLength(0);
  } finally { await client.query('ROLLBACK'); await client.end(); }
}, 15_000);

it('миграция повторяется без потери сохранённого статуса', async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname)) throw new Error('Нужна локальная БД');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA tbb_dialogs_migration_test');
    await client.query('SET LOCAL search_path TO tbb_dialogs_migration_test');
    await client.query('CREATE TABLE bot_projects (id int PRIMARY KEY); CREATE TABLE bot_tokens (id int PRIMARY KEY)');
    await client.query(CHAT_ACCESS_DDL);
    await client.query("INSERT INTO bot_projects VALUES (12); INSERT INTO bot_tokens VALUES (9); INSERT INTO chat_access VALUES (12,9,'-1001','kicked',now())");
    await client.query(CHAT_ACCESS_DDL);
    expect((await client.query('SELECT status FROM chat_access')).rows).toEqual([{ status: 'kicked' }]);
  } finally { await client.query('ROLLBACK'); await client.end(); }
}, 15_000);
