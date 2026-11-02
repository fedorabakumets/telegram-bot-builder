/** @fileoverview Атомарная идемпотентная запись аналитики и объявление покрытия работающего бота. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
/** Проверяет область runtime до выполнения операции с правами владельца функции. */
CREATE OR REPLACE FUNCTION analytics_assert_scope_v2(p_project integer,p_token integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF (session_user = 'bot_runtime' OR current_setting('role',true) = 'bot_runtime') AND
     (NULLIF(current_setting('app.project_id',true),'')::integer IS DISTINCT FROM p_project OR
      NULLIF(current_setting('app.token_id',true),'')::integer IS DISTINCT FROM p_token) THEN
    RAISE EXCEPTION 'Область runtime не совпадает с событием' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM bot_tokens WHERE id=p_token AND project_id=p_project) THEN
    IF EXISTS(SELECT 1 FROM bot_tokens WHERE id=p_token) THEN
      RAISE EXCEPTION 'Бот не принадлежит проекту' USING ERRCODE='42501';
    END IF;
    RAISE EXCEPTION 'Бот или проект удалён' USING ERRCODE='PBA01';
  END IF;
END $$;
/** Фиксирует начало новой методики и неизвестную историю ранее существовавших профилей. */
CREATE OR REPLACE FUNCTION mark_analytics_runtime_v2(p_project integer,p_token integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE inserted integer; rev bigint;
BEGIN
  PERFORM analytics_assert_scope_v2(p_project,p_token);
  INSERT INTO analytics_runtime_v2(project_id,token_id) VALUES(p_project,p_token) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted > 0 THEN
    INSERT INTO analytics_legacy_people_v2(project_id,token_id,user_id)
      SELECT p_project,p_token,user_id::text FROM bot_users
      WHERE project_id=p_project AND token_id=p_token AND COALESCE(is_bot,0)=0
      ON CONFLICT DO NOTHING;
    INSERT INTO analytics_versions_v2(project_id,revision) VALUES(p_project,1)
      ON CONFLICT(project_id) DO UPDATE SET revision=analytics_versions_v2.revision+1 RETURNING revision INTO rev;
    INSERT INTO analytics_outbox_v2(project_id,token_id,revision,affected) VALUES(p_project,p_token,rev,ARRAY['coverage','audience']);
    PERFORM pg_notify('analytics_v2_changed',p_project::text);
  ELSE
    UPDATE analytics_runtime_v2 SET last_seen_at=clock_timestamp() WHERE project_id=p_project AND token_id=p_token;
  END IF;
END $$;
/** Записывает минимальный факт, аудиторию, дневной счётчик и уведомление одной транзакцией. */
CREATE OR REPLACE FUNCTION record_analytics_event_v2(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  p_project integer := (payload->>'project_id')::integer;
  p_token integer := (payload->>'token_id')::integer;
  p_kind text := payload->>'kind';
  p_user text := NULLIF(payload->>'user_id','');
  p_chat text := NULLIF(payload->>'chat_id','');
  p_type text := COALESCE(payload->>'chat_type','unknown');
  p_at timestamptz := (payload->>'occurred_at')::timestamptz;
  p_key text := payload->>'event_key';
  p_directed boolean := COALESCE((payload->>'directed')::boolean,false);
  p_known boolean := COALESCE((payload->>'first_known')::boolean,true);
  p_source integer := (payload->>'source_id')::integer;
  p_link integer := (payload->>'link_id')::integer;
  p_placement integer := (payload->>'placement_id')::integer;
  p_status text := COALESCE(payload->>'attribution_status','no_marker');
  p_purpose text := LEFT(payload->>'purpose',40);
  p_referrer text := payload->>'referrer_id';
  p_observed text := payload->>'observed_tag';
  p_meta jsonb;
  resolved_link record;
  event_id bigint; rev bigint;
BEGIN
  BEGIN
    PERFORM analytics_assert_scope_v2(p_project,p_token);
  EXCEPTION WHEN SQLSTATE 'PBA01' THEN
    RETURN jsonb_build_object('event_id',NULL,'revision',NULL,'inserted',false,'discarded',true,'reason','resource_deleted');
  END;
  IF p_at IS NULL OR p_at > clock_timestamp()+INTERVAL '5 minutes' OR p_key IS NULL OR
     p_key !~ '^[A-Za-z0-9:_-]{1,220}$' OR p_kind NOT IN ('message_in','message_out','callback','system') THEN
    RAISE EXCEPTION 'Некорректное событие аналитики' USING ERRCODE='22023';
  END IF;
  IF p_user IS NOT NULL AND (p_user !~ '^[1-9][0-9]{0,19}$' OR EXISTS(SELECT 1 FROM bot_users
    WHERE project_id=p_project AND token_id=p_token AND user_id::text=p_user AND is_bot=1)) THEN p_user := NULL; END IF;
  p_directed := p_directed AND p_user IS NOT NULL AND p_kind IN ('message_in','callback') AND p_type <> 'channel';
  /** Блокировка предшествует разрешению ссылки: удаление реферера не может вернуть устаревшую привязку. */
  INSERT INTO analytics_versions_v2(project_id) VALUES(p_project) ON CONFLICT DO NOTHING;
  SELECT revision INTO rev FROM analytics_versions_v2 WHERE project_id=p_project FOR UPDATE;
  /** После удаления старый replay не восстанавливает человека; новые реальные действия допустимы. */
  IF p_user IS NOT NULL AND EXISTS(SELECT 1 FROM analytics_person_deletions_v2
    WHERE project_id=p_project AND token_id=p_token
      AND person_key=encode(sha256(convert_to(p_project::text||':'||p_token::text||':'||p_user,'UTF8')),'hex')
      AND p_at<=deleted_through) THEN
    RETURN jsonb_build_object('event_id',NULL,'revision',rev::text,'inserted',false,'discarded',true,'reason','person_deleted');
  END IF;
  IF p_status NOT IN ('no_marker','unknown','referral_unknown','site_login','auth_candidate','resolved') THEN p_status := 'unknown'; END IF;
  IF p_purpose IS NOT NULL AND p_purpose NOT IN ('start','acquisition','referral','combined','auth','site_login','interaction') THEN p_purpose := NULL; END IF;
  IF p_observed IS NOT NULL AND (p_observed !~ '^[A-Za-z0-9_-]{1,64}$' OR lower(p_observed) LIKE 'link\_%' ESCAPE '\') THEN p_observed := NULL; END IF;
  /** Повторяем разрешение в общей транзакции, если ранний lookup временно не дал результата. */
  IF p_source IS NULL AND p_observed IS NOT NULL THEN
    SELECT source_id,id,placement_id,referrer_id,purpose INTO resolved_link FROM analytics_links
      WHERE project_id=p_project AND token_id=p_token AND code=p_observed;
    IF FOUND THEN
      p_source:=resolved_link.source_id; p_link:=resolved_link.id; p_placement:=resolved_link.placement_id;
      p_referrer:=resolved_link.referrer_id; p_purpose:=resolved_link.purpose; p_status := 'resolved';
    END IF;
  END IF;
  IF p_source IS NOT NULL AND NOT EXISTS(SELECT 1 FROM analytics_sources WHERE project_id=p_project AND id=p_source) THEN
    RAISE EXCEPTION 'Источник не принадлежит проекту' USING ERRCODE='42501';
  END IF;
  IF p_placement IS NOT NULL AND NOT EXISTS(SELECT 1 FROM analytics_placements
    WHERE project_id=p_project AND token_id=p_token AND id=p_placement AND source_id=p_source) THEN
    RAISE EXCEPTION 'Размещение не принадлежит боту или источнику' USING ERRCODE='42501';
  END IF;
  IF p_link IS NOT NULL AND NOT EXISTS(SELECT 1 FROM analytics_links
    WHERE project_id=p_project AND token_id=p_token AND id=p_link AND source_id=p_source AND placement_id=p_placement) THEN
    RAISE EXCEPTION 'Ссылка не принадлежит размещению' USING ERRCODE='42501';
  END IF;
  IF p_referrer IS NOT NULL AND NOT EXISTS(SELECT 1 FROM analytics_links
    WHERE project_id=p_project AND token_id=p_token AND id=p_link AND referrer_id=p_referrer) THEN p_referrer := NULL; END IF;
  IF p_referrer IS NOT NULL AND (p_referrer !~ '^[1-9][0-9]{0,19}$' OR p_referrer=p_user) THEN p_referrer := NULL; END IF;
  p_meta := jsonb_strip_nulls(jsonb_build_object('button_label',LEFT(regexp_replace(payload->'metadata'->>'button_label','link_[A-Za-z0-9_-]+','link_[скрыто]','g'),160),
    'system_kind',LEFT(regexp_replace(payload->'metadata'->>'system_kind','link_[A-Za-z0-9_-]+','link_[скрыто]','g'),60),
    'entry',CASE WHEN payload->'metadata'->>'entry'='true' THEN true END));
  IF NOT EXISTS(SELECT 1 FROM analytics_runtime_v2 WHERE project_id=p_project AND token_id=p_token)
    OR COALESCE(payload->>'provenance','live')='backfill' OR EXISTS(SELECT 1 FROM analytics_legacy_people_v2
    WHERE project_id=p_project AND token_id=p_token AND user_id=p_user) THEN p_known := false; END IF;
  INSERT INTO analytics_events_v2(project_id,token_id,event_key,kind,user_id,chat_id,chat_type,directed,occurred_at,
    source_id,link_id,placement_id,referrer_id,purpose,observed_tag,attribution_status,metadata,provenance,first_known)
    VALUES(p_project,p_token,p_key,p_kind,p_user,p_chat,p_type,p_directed,p_at,p_source,p_link,p_placement,p_referrer,
      p_purpose,p_observed,p_status,p_meta,COALESCE(payload->>'provenance','live'),p_known)
    ON CONFLICT(project_id,token_id,event_key) DO NOTHING RETURNING id INTO event_id;
  IF event_id IS NULL THEN
    SELECT id INTO event_id FROM analytics_events_v2 WHERE project_id=p_project AND token_id=p_token AND event_key=p_key;
    RETURN jsonb_build_object('event_id',event_id::text,'revision',rev::text,'inserted',false);
  END IF;
  IF p_directed THEN
    INSERT INTO analytics_audience_v2(project_id,token_id,user_id,first_interaction_at,last_interaction_at,first_event_id,
      first_known,source_id,link_id,placement_id,referrer_id,purpose,observed_tag,attribution_status)
      VALUES(p_project,p_token,p_user,p_at,p_at,event_id,p_known,p_source,p_link,p_placement,p_referrer,p_purpose,p_observed,p_status)
      ON CONFLICT(project_id,token_id,user_id) DO UPDATE SET
        last_interaction_at=GREATEST(analytics_audience_v2.last_interaction_at,EXCLUDED.last_interaction_at);
    UPDATE analytics_audience_v2 SET first_interaction_at=p_at,first_event_id=event_id,first_known=p_known,
      source_id=p_source,link_id=p_link,placement_id=p_placement,referrer_id=p_referrer,purpose=p_purpose,observed_tag=p_observed,attribution_status=p_status
      WHERE project_id=p_project AND token_id=p_token AND user_id=p_user AND first_interaction_at>p_at;
  END IF;
  INSERT INTO analytics_daily_v2(project_id,token_id,day,kind,directed,event_count)
    VALUES(p_project,p_token,(p_at AT TIME ZONE 'UTC')::date,p_kind,p_directed,1)
    ON CONFLICT(project_id,token_id,day,kind,directed) DO UPDATE SET event_count=analytics_daily_v2.event_count+1;
  UPDATE analytics_versions_v2 SET revision=revision+1 WHERE project_id=p_project RETURNING revision INTO rev;
  INSERT INTO analytics_outbox_v2(project_id,token_id,revision) VALUES(p_project,p_token,rev);
  PERFORM pg_notify('analytics_v2_changed',p_project::text);
  RETURN jsonb_build_object('event_id',event_id::text,'revision',rev::text,'inserted',true);
END $$;
REVOKE ALL ON FUNCTION analytics_assert_scope_v2(integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_analytics_runtime_v2(integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_analytics_event_v2(jsonb) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bot_runtime') THEN
    GRANT EXECUTE ON FUNCTION mark_analytics_runtime_v2(integer,integer),record_analytics_event_v2(jsonb) TO bot_runtime;
  END IF;
END $$;
COMMIT;
