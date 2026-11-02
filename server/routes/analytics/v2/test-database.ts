/** @fileoverview Изолированная временная схема PostgreSQL для настоящих проверок аналитических транзакций. */
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
/**
 * Создаёт тестовую схему, не изменяя таблицы локального приложения.
 * @returns Соединение, создание/очистка и минимальный писатель событий.
 */
export function createAnalyticsTestDatabase() {
  const schema = `analytics_v2_test_${process.pid}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const runtimeRole = `${schema}_runtime`;
  const connectionString = process.env.ANALYTICS_TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const admin = new Pool({ connectionString });
  const pool = new Pool({ connectionString, options: `-c search_path=${schema} -c timezone=UTC` });
  /** Создаёт минимальные зависимости и применяет настоящие миграции в отдельной схеме. */
  async function setup() {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await admin.query(`CREATE ROLE ${runtimeRole} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT; GRANT USAGE ON SCHEMA ${schema} TO ${runtimeRole}`);
    await pool.query(`CREATE TABLE bot_projects(id integer PRIMARY KEY,data jsonb DEFAULT '{}');
      CREATE TABLE bot_tokens(id integer PRIMARY KEY,project_id integer REFERENCES bot_projects(id) ON DELETE CASCADE,name text,bot_username text);
      CREATE TABLE bot_users(project_id integer,token_id integer,user_id bigint,is_bot integer DEFAULT 0,first_name text,last_name text,username text,
        is_blocked integer DEFAULT 0,is_deleted integer DEFAULT 0,is_premium integer DEFAULT 0,language_code text,last_interaction timestamptz,
        registered_at timestamptz DEFAULT now(),interaction_count integer DEFAULT 0,PRIMARY KEY(project_id,token_id,user_id));
      CREATE TABLE bot_groups(id serial PRIMARY KEY,project_id integer,token_id integer,group_id text,name text,updated_at timestamptz);
      CREATE TABLE bot_messages(id serial PRIMARY KEY,project_id integer,token_id integer,user_id text,message_type text,message_data jsonb,
        telegram_message_id integer,chat_type text,chat_id text,created_at timestamptz DEFAULT now(),message_text text,node_id text,primary_media_id integer);
      CREATE TABLE user_activity_daily(project_id integer,token_id integer,user_id bigint,day date,first_seen_at timestamptz,PRIMARY KEY(project_id,token_id,day,user_id));
      CREATE TABLE message_activity_daily(project_id integer,token_id integer,day date,incoming_count bigint,outgoing_count bigint,PRIMARY KEY(project_id,token_id,day));
      CREATE TABLE chat_access_check_jobs(project_id integer,token_id integer,status text,total_count integer,processed_count integer,error_count integer,finished_at timestamptz);
      INSERT INTO bot_projects(id) VALUES(1),(2);
      INSERT INTO bot_tokens(id,project_id,name,bot_username) VALUES(11,1,'Первый','first_bot'),(12,1,'Второй','second_bot'),(21,2,'Чужой','other_bot');`);
    for (const file of ['0024_analytics_v2.sql', '0025_analytics_v2_record.sql', '0026_analytics_v2_privacy.sql', '0027_analytics_acquisition.sql', '0028_analytics_link_resolver.sql', '0029_analytics_table_date.sql', '0030_analytics_audience_evidence.sql', '0031_analytics_start_observations.sql', '0032_analytics_private_no_marker.sql', '0033_analytics_evidence_no_marker.sql', '0034_analytics_evidence_button_labels.sql', '0035_analytics_placement_history.sql']) {
      const sql = readFileSync(`migrations/${file}`, 'utf8').split('public.').join(`${schema}.`)
        .split('search_path = public, pg_temp').join(`search_path = ${schema}, pg_temp`).split('search_path=pg_catalog,public').join(`search_path=pg_catalog,${schema}`)
        .split('bot_runtime').join(runtimeRole);
      await pool.query(sql);
    }
  }
  /** Полностью убирает только уникальную тестовую схему. */
  async function cleanup() {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.query(`DROP ROLE IF EXISTS ${runtimeRole}`);
    await admin.end();
  }
  /** Записывает событие настоящей SQL-функцией с минимальными удобными значениями. */
  async function record(input: Record<string, unknown>) {
    const payload = { project_id: 1, token_id: 11, event_key: 'msg:42:1', kind: 'message_in', user_id: '42', chat_id: '42',
      chat_type: 'private', directed: true, occurred_at: '2026-10-20T12:00:00Z', ...input };
    const { rows: [row] } = await pool.query('SELECT record_analytics_event_v2($1::jsonb) result', [JSON.stringify(payload)]);
    return row.result as { event_id: string; revision: string; inserted: boolean };
  }
  return { schema, runtimeRole, admin, pool, setup, cleanup, record };
}
