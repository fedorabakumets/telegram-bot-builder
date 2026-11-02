/** @fileoverview Исторические свидетельства аудитории без выдуманных физических сообщений и callback. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
/** Отдельный курсор: завершённый перенос событий не препятствует проверке старых свидетельств. */
CREATE TABLE IF NOT EXISTS analytics_evidence_backfill_v2 (
  id bigserial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  writer_sha256 text NOT NULL CHECK(writer_sha256 ~ '^[a-f0-9]{64}$'),
  historical_username text NOT NULL CHECK(historical_username ~ '^[A-Za-z0-9_]{1,32}$'),
  through_message_id bigint NOT NULL CHECK(through_message_id>0),
  provenance_limit text NOT NULL DEFAULT 'audited_writer_shape_without_per_row_build_identity',
  last_message_id bigint NOT NULL DEFAULT 0,scanned bigint NOT NULL DEFAULT 0,
  evidence_count bigint NOT NULL DEFAULT 0,audience_added bigint NOT NULL DEFAULT 0,physical_callbacks bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(project_id,token_id,writer_sha256,historical_username,through_message_id),UNIQUE(project_id,token_id,id)
);
/** Индекс также обновляет предварительную версию схемы, уже применённую наблюдающим dev-сервером. */
CREATE UNIQUE INDEX IF NOT EXISTS analytics_evidence_backfill_v2_scope_id ON analytics_evidence_backfill_v2(project_id,token_id,id);
/** Здесь нет текста, callback payload и предположительно восстановленного Telegram callback ID. */
CREATE TABLE IF NOT EXISTS analytics_audience_evidence_v2 (
  id bigserial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  user_id text NOT NULL CHECK(user_id ~ '^[1-9][0-9]{0,19}$'),
  legacy_message_id bigint NOT NULL,
  reason text NOT NULL CHECK(reason IN ('legacy_callback','addressed_command')),
  observed_at timestamptz NOT NULL,
  chat_type text NOT NULL CHECK(chat_type IN ('private','group','supergroup')),
  chat_id text CHECK(chat_id ~ '^-?[0-9]{1,20}$'),
  policy_id bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(project_id,token_id,legacy_message_id),UNIQUE(project_id,token_id,user_id,id),
  CONSTRAINT analytics_audience_evidence_v2_policy_fk FOREIGN KEY(project_id,token_id,policy_id)
    REFERENCES analytics_evidence_backfill_v2(project_id,token_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS analytics_audience_evidence_v2_scope_time ON analytics_audience_evidence_v2(project_id,token_id,observed_at);
ALTER TABLE analytics_audience_v2 ALTER COLUMN first_event_id DROP NOT NULL;
ALTER TABLE analytics_audience_v2 ADD COLUMN IF NOT EXISTS legacy_evidence_id bigint;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='analytics_audience_evidence_v2'::regclass AND conname='analytics_audience_evidence_v2_policy_fk') THEN
    ALTER TABLE analytics_audience_evidence_v2 ADD CONSTRAINT analytics_audience_evidence_v2_policy_fk
      FOREIGN KEY(project_id,token_id,policy_id) REFERENCES analytics_evidence_backfill_v2(project_id,token_id,id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='analytics_audience_v2'::regclass AND conname='analytics_audience_v2_evidence_fk') THEN
    ALTER TABLE analytics_audience_v2 ADD CONSTRAINT analytics_audience_v2_evidence_fk
      FOREIGN KEY(project_id,token_id,user_id,legacy_evidence_id)
      REFERENCES analytics_audience_evidence_v2(project_id,token_id,user_id,id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='analytics_audience_v2'::regclass AND conname='analytics_audience_v2_origin_check') THEN
    ALTER TABLE analytics_audience_v2 ADD CONSTRAINT analytics_audience_v2_origin_check CHECK(first_event_id IS NOT NULL OR legacy_evidence_id IS NOT NULL);
  END IF;
END $$;
/** Удаление переписки свидетельств не касается; удаление человека очищает и этот контур. */
CREATE OR REPLACE FUNCTION analytics_delete_evidence_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM bot_projects WHERE id=OLD.project_id) THEN
    INSERT INTO analytics_versions_v2(project_id) VALUES(OLD.project_id) ON CONFLICT DO NOTHING;
    PERFORM revision FROM analytics_versions_v2 WHERE project_id=OLD.project_id FOR UPDATE;
  END IF;
  DELETE FROM analytics_audience_evidence_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id::text;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION analytics_delete_evidence_v2() FROM PUBLIC;
DROP TRIGGER IF EXISTS analytics_delete_evidence_v2 ON bot_users;
CREATE TRIGGER analytics_delete_evidence_v2 AFTER DELETE ON bot_users FOR EACH ROW EXECUTE FUNCTION analytics_delete_evidence_v2();
COMMIT;
