/** @fileoverview Полное удаление аналитических данных человека вместе с удалением его профиля. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
/** Удаляет независимые факты и дневные следы, затем уведомляет подписчиков об изменении. */
CREATE OR REPLACE FUNCTION analytics_delete_person_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE rev bigint;
BEGIN
  /** Согласуем порядок блокировок с записью события и финансовых изменений. */
  IF EXISTS(SELECT 1 FROM bot_projects WHERE id=OLD.project_id) THEN
    INSERT INTO analytics_versions_v2(project_id) VALUES(OLD.project_id) ON CONFLICT DO NOTHING;
    PERFORM revision FROM analytics_versions_v2 WHERE project_id=OLD.project_id FOR UPDATE;
    /** Идентичность не хранится открыто; граница остаётся до удаления проекта или бота. */
    IF EXISTS(SELECT 1 FROM bot_tokens WHERE id=OLD.token_id AND project_id=OLD.project_id) THEN
      INSERT INTO analytics_person_deletions_v2(project_id,token_id,person_key,deleted_through)
        VALUES(OLD.project_id,OLD.token_id,encode(sha256(convert_to(OLD.project_id::text||':'||OLD.token_id::text||':'||OLD.user_id::text,'UTF8')),'hex'),clock_timestamp())
        ON CONFLICT(project_id,token_id,person_key) DO UPDATE SET deleted_through=GREATEST(analytics_person_deletions_v2.deleted_through,EXCLUDED.deleted_through);
    END IF;
  END IF;
  DELETE FROM analytics_audience_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id::text;
  DELETE FROM analytics_events_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id::text;
  DELETE FROM analytics_legacy_people_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id::text;
  DELETE FROM user_activity_daily WHERE project_id=OLD.project_id AND token_id=OLD.token_id AND user_id=OLD.user_id;
  /** Удаляем идентичность пригласившего, сохраняя историю размещений и суммы других людей. */
  UPDATE analytics_events_v2 SET referrer_id=NULL WHERE project_id=OLD.project_id AND referrer_id=OLD.user_id::text;
  UPDATE analytics_audience_v2 SET referrer_id=NULL WHERE project_id=OLD.project_id AND referrer_id=OLD.user_id::text;
  UPDATE analytics_links SET referrer_id=NULL WHERE project_id=OLD.project_id AND referrer_id=OLD.user_id::text;
  UPDATE analytics_acquisition_audit SET
    before_data=CASE WHEN before_data->>'referrer_id'=OLD.user_id::text THEN jsonb_set(before_data,'{referrer_id}','null') ELSE before_data END,
    after_data=CASE WHEN after_data->>'referrer_id'=OLD.user_id::text THEN jsonb_set(after_data,'{referrer_id}','null') ELSE after_data END
    WHERE project_id=OLD.project_id AND resource='links'
      AND (before_data->>'referrer_id'=OLD.user_id::text OR after_data->>'referrer_id'=OLD.user_id::text);
  /** Пересчитываем лишь агрегаты удаляемого бота; переписка здесь не затрагивается. */
  DELETE FROM analytics_daily_v2 WHERE project_id=OLD.project_id AND token_id=OLD.token_id;
  INSERT INTO analytics_daily_v2(project_id,token_id,day,kind,directed,event_count)
    SELECT project_id,token_id,(occurred_at AT TIME ZONE 'UTC')::date,kind,directed,COUNT(*) FROM analytics_events_v2
    WHERE project_id=OLD.project_id AND token_id=OLD.token_id GROUP BY project_id,token_id,(occurred_at AT TIME ZONE 'UTC')::date,kind,directed;
  IF EXISTS(SELECT 1 FROM bot_projects WHERE id=OLD.project_id) THEN
    INSERT INTO analytics_versions_v2(project_id,revision) VALUES(OLD.project_id,1)
      ON CONFLICT(project_id) DO UPDATE SET revision=analytics_versions_v2.revision+1 RETURNING revision INTO rev;
    INSERT INTO analytics_outbox_v2(project_id,token_id,revision) VALUES(OLD.project_id,NULL,rev);
    PERFORM pg_notify('analytics_v2_changed',OLD.project_id::text);
  END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION analytics_delete_person_v2() FROM PUBLIC;
DROP TRIGGER IF EXISTS analytics_delete_person_v2 ON bot_users;
CREATE TRIGGER analytics_delete_person_v2 AFTER DELETE ON bot_users FOR EACH ROW EXECUTE FUNCTION analytics_delete_person_v2();
COMMIT;
