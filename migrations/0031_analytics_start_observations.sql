/** @fileoverview Независимые наблюдения старых /start без подмены подтверждённого источника и без кодов авторизации. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
CREATE TABLE IF NOT EXISTS analytics_start_observations_v2 (
  id bigserial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  user_id text NOT NULL CHECK(user_id ~ '^[1-9][0-9]{0,19}$'),
  legacy_message_id bigint NOT NULL,
  event_key text NOT NULL CHECK(event_key ~ '^msg:-?[0-9]{1,20}:[1-9][0-9]*$'),
  observed_at timestamptz NOT NULL,
  marker text CHECK(marker ~ '^[A-Za-z0-9_-]{1,64}$' AND lower(marker) NOT LIKE '%link\_%' ESCAPE '\'),
  category text NOT NULL CHECK(category IN ('marker','no_marker','referral_unknown','auth_candidate')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK((category IN ('no_marker','auth_candidate') AND marker IS NULL) OR (category IN ('marker','referral_unknown') AND marker IS NOT NULL)),
  UNIQUE(project_id,token_id,event_key)
);
CREATE INDEX IF NOT EXISTS analytics_start_observations_v2_scope_time ON analytics_start_observations_v2(project_id,token_id,observed_at);
CREATE TABLE IF NOT EXISTS analytics_start_observation_backfill_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  last_message_id bigint NOT NULL DEFAULT 0,
  scanned bigint NOT NULL DEFAULT 0,imported bigint NOT NULL DEFAULT 0,skipped bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(project_id,token_id)
);
/** Переписка может очищаться независимо; полное удаление человека удаляет наблюдения. */
CREATE OR REPLACE FUNCTION analytics_delete_start_observations_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM bot_projects WHERE id=OLD.project_id) THEN
    INSERT INTO analytics_versions_v2(project_id) VALUES(OLD.project_id) ON CONFLICT DO NOTHING;
    PERFORM revision FROM analytics_versions_v2 WHERE project_id=OLD.project_id FOR UPDATE;
  END IF;
  DELETE FROM analytics_start_observations_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id::text;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION analytics_delete_start_observations_v2() FROM PUBLIC;
DROP TRIGGER IF EXISTS analytics_delete_start_observations_v2 ON bot_users;
CREATE TRIGGER analytics_delete_start_observations_v2 AFTER DELETE ON bot_users FOR EACH ROW EXECUTE FUNCTION analytics_delete_start_observations_v2();
COMMIT;
