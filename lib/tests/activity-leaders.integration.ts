/** @fileoverview Проверка реального SQL рейтингов на изолированных временных таблицах. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { Pool } from 'pg';
import { queryActivityLeaders } from '../../server/routes/analytics/query-activity-leaders';

/** Проверяет ID, период, направления, callback, фильтр области и отсутствие размножения именами. */
async function verify() {
  const env = parse(readFileSync('.env'));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    await client.query(`CREATE TEMP TABLE bot_messages(project_id int,token_id int,user_id text,chat_id text,chat_type text,created_at timestamptz,message_type text,message_data jsonb) ON COMMIT DROP;
      CREATE TEMP TABLE bot_users(project_id int,token_id int,user_id bigint,first_name text,last_name text,username text,last_interaction timestamptz) ON COMMIT DROP;
      CREATE TEMP TABLE bot_groups(id int,project_id int,token_id int,group_id text,name text,chat_type text,updated_at timestamptz) ON COMMIT DROP;
      INSERT INTO bot_messages VALUES
      (12,1,'42','-100','group','2026-11-01','user','{}'),
      (12,2,'42','-100','supergroup','2026-11-01','user','{"button_clicked":true}'),
      (12,1,'43','-101','channel','2026-11-01','user','{}'),
      (12,1,'42','-100','group','2026-11-01','bot','{}'),
      (12,1,'42','-100','group','2025-11-01','user','{}'),
      (99,1,'42','-100','group','2026-11-01','user','{}'),
      (12,1,'42','-100','group','2026-11-02','user','{}');
      INSERT INTO bot_users VALUES (12,1,42,'Иван','','ivan','2026-11-01'),(12,2,42,'Иван','','ivan','2026-11-01'),(12,1,43,'Иван','','other','2026-11-01');
      INSERT INTO bot_groups VALUES (1,12,1,'-100','Группа','group','2026-11-01'),(2,12,2,'-100','Новое название','supergroup','2026-11-01');`);
    const data = await queryActivityLeaders(client, 12, null, '30 days', '2026-11-02T00:00:00Z');
    assert.equal(data.users.length, 2);
    assert.equal(data.users[0].total, 2);
    assert.equal(data.users[0].messages, 1);
    assert.equal(data.users[0].clicks, 1);
    assert.equal(data.groups.length, 1);
    assert.equal(data.groups[0].total, 2);
    assert.equal(data.groups[0].name, 'Новое название');
    const scoped = await queryActivityLeaders(client, 12, 1, '30 days', '2026-11-02T00:00:00Z');
    assert.equal(scoped.users.find((row: { id: string }) => row.id === '42').total, 1);
    assert.equal(scoped.groups[0].clicks, 0);
    console.log('Проверены идентичность, общий проект, токен, callback, период, исключение каналов и исходящих.');
  } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
}
void verify().catch(error => { console.error(error); process.exitCode = 1; });
