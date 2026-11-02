/** @fileoverview Уточнение источников аудированных исторических нажатий в личке без превращения их в физические callback. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
/** Не меняем первую дату, точность истории, источник рекламы, авторизацию и счётчики событий. */
DO $$
DECLARE scope integer; changed integer; rev bigint;
BEGIN
  FOR scope IN SELECT DISTINCT project_id FROM analytics_audience_v2 WHERE attribution_status='unknown' ORDER BY project_id LOOP
    INSERT INTO analytics_versions_v2(project_id) VALUES(scope) ON CONFLICT DO NOTHING;
    PERFORM revision FROM analytics_versions_v2 WHERE project_id=scope FOR UPDATE;
    UPDATE analytics_audience_v2 a SET attribution_status='no_marker'
      FROM analytics_audience_evidence_v2 e
      WHERE a.project_id=scope AND a.attribution_status='unknown' AND a.first_event_id IS NULL AND a.legacy_evidence_id=e.id
        AND e.project_id=a.project_id AND e.token_id=a.token_id AND e.user_id=a.user_id
        AND e.reason='legacy_callback' AND e.chat_type='private'
        AND a.source_id IS NULL AND a.link_id IS NULL AND a.placement_id IS NULL
        AND a.referrer_id IS NULL AND a.purpose IS NULL AND a.observed_tag IS NULL
        AND NOT EXISTS(SELECT 1 FROM analytics_start_observations_v2 o WHERE o.project_id=a.project_id
          AND o.token_id=a.token_id AND o.user_id=a.user_id AND o.legacy_message_id=e.legacy_message_id AND o.category<>'no_marker');
    GET DIAGNOSTICS changed=ROW_COUNT;
    IF changed>0 THEN
      UPDATE analytics_versions_v2 SET revision=revision+1 WHERE project_id=scope RETURNING revision INTO rev;
      INSERT INTO analytics_outbox_v2(project_id,revision,affected) VALUES(scope,rev,ARRAY['sources']);
      PERFORM pg_notify('analytics_v2_changed',scope::text);
    END IF;
  END LOOP;
END $$;
COMMIT;
