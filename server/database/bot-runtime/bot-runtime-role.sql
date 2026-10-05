-- Идемпотентные права роли bot_runtime и политики RLS.
-- Это не миграция drizzle и не шаг npm run migrate: файл выполняет
-- только ensure-bot-runtime-role, когда включён BOT_RUNTIME_ENABLED
-- и задан BOT_DATABASE_URL.
-- Пароль роли в этот файл не входит.
--
-- FORCE ROW LEVEL SECURITY подчиняет политикам и владельца таблиц.
-- Суперпользователь политики обходит сам. Чтобы панель на своём
-- DATABASE_URL продолжала видеть все строки, политика пропускает
-- любую роль, кроме bot_runtime. BYPASSRLS роли панели не выдаётся.

DO $bot_runtime$
DECLARE
  tbl text;
  seq text;
  direct_tables text[] := ARRAY[
    'bot_users',
    'bot_messages',
    'message_activity_daily',
    'user_activity_daily',
    'schedule_state'
  ];
  project_tables text[] := ARRAY[
    'media_files',
    'bot_tables'
  ];
  child_tables text[] := ARRAY[
    'bot_message_media',
    'bot_table_columns',
    'bot_table_rows',
    'media_file_tokens'
  ];
  sequences text[] := ARRAY[
    'bot_messages_id_seq',
    'bot_message_media_id_seq',
    'media_files_id_seq',
    'media_file_tokens_id_seq',
    'bot_tables_id_seq',
    'bot_table_columns_id_seq',
    'bot_table_rows_id_seq',
    'schedule_state_id_seq'
  ];
  both_cols text := $policy$
    current_user <> 'bot_runtime'
    OR (
      project_id = NULLIF(current_setting('app.project_id', true), '')::integer
      AND token_id = NULLIF(current_setting('app.token_id', true), '')::integer
    )
  $policy$;
  project_only text := $policy$
    current_user <> 'bot_runtime'
    OR (
      NULLIF(current_setting('app.project_id', true), '') IS NOT NULL
      AND NULLIF(current_setting('app.token_id', true), '') IS NOT NULL
      AND project_id = NULLIF(current_setting('app.project_id', true), '')::integer
    )
  $policy$;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bot_runtime') THEN
    CREATE ROLE bot_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;
  END IF;

  ALTER ROLE bot_runtime WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;
  EXECUTE 'REVOKE CREATE ON SCHEMA public FROM bot_runtime';

  FOREACH tbl IN ARRAY direct_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO bot_runtime', tbl);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS bot_runtime_isolation ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY bot_runtime_isolation ON %I FOR ALL USING (%s) WITH CHECK (%s)',
      tbl, both_cols, both_cols
    );
  END LOOP;

  FOREACH tbl IN ARRAY project_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO bot_runtime', tbl);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS bot_runtime_isolation ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY bot_runtime_isolation ON %I FOR ALL USING (%s) WITH CHECK (%s)',
      tbl, project_only, project_only
    );
  END LOOP;

  FOREACH tbl IN ARRAY child_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO bot_runtime', tbl);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS bot_runtime_isolation ON %I', tbl);
  END LOOP;

  EXECUTE $sql$
    CREATE POLICY bot_runtime_isolation ON bot_message_media
      FOR ALL
      USING (
        current_user <> 'bot_runtime'
        OR EXISTS (
          SELECT 1 FROM bot_messages parent
          WHERE parent.id = bot_message_media.message_id
            AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
            AND parent.token_id = NULLIF(current_setting('app.token_id', true), '')::integer
        )
      )
      WITH CHECK (
        current_user <> 'bot_runtime'
        OR EXISTS (
          SELECT 1 FROM bot_messages parent
          WHERE parent.id = bot_message_media.message_id
            AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
            AND parent.token_id = NULLIF(current_setting('app.token_id', true), '')::integer
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY bot_runtime_isolation ON bot_table_columns
      FOR ALL
      USING (
        current_user <> 'bot_runtime'
        OR (
          NULLIF(current_setting('app.token_id', true), '') IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM bot_tables parent
            WHERE parent.id = bot_table_columns.table_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
      WITH CHECK (
        current_user <> 'bot_runtime'
        OR (
          NULLIF(current_setting('app.token_id', true), '') IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM bot_tables parent
            WHERE parent.id = bot_table_columns.table_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY bot_runtime_isolation ON bot_table_rows
      FOR ALL
      USING (
        current_user <> 'bot_runtime'
        OR (
          NULLIF(current_setting('app.token_id', true), '') IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM bot_tables parent
            WHERE parent.id = bot_table_rows.table_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
      WITH CHECK (
        current_user <> 'bot_runtime'
        OR (
          NULLIF(current_setting('app.token_id', true), '') IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM bot_tables parent
            WHERE parent.id = bot_table_rows.table_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY bot_runtime_isolation ON media_file_tokens
      FOR ALL
      USING (
        current_user <> 'bot_runtime'
        OR (
          token_id = NULLIF(current_setting('app.token_id', true), '')::integer
          AND EXISTS (
            SELECT 1 FROM media_files parent
            WHERE parent.id = media_file_tokens.media_file_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
      WITH CHECK (
        current_user <> 'bot_runtime'
        OR (
          token_id = NULLIF(current_setting('app.token_id', true), '')::integer
          AND EXISTS (
            SELECT 1 FROM media_files parent
            WHERE parent.id = media_file_tokens.media_file_id
              AND parent.project_id = NULLIF(current_setting('app.project_id', true), '')::integer
          )
        )
      )
  $sql$;

  FOREACH seq IN ARRAY sequences LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO bot_runtime', seq);
  END LOOP;
END
$bot_runtime$;
