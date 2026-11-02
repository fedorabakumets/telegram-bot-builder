/** @fileoverview Источник первого физического либо аудированного исторического действия: метка, группа либо личное сообщение без метки; рекламная атрибуция сохраняется отдельно. */
/**
 * Добавляет наблюдаемые источники и входы к общим CTE снимка.
 * @returns Статический SQL с областью $1/$2 и границами $3/$4.
 */
export function v2SourceOriginsSql(): string {
  return `source_firsts AS (
    SELECT f.*,COALESCE(f.source_id::text,
      CASE WHEN (original.kind='callback' AND original.directed OR evidence.reason='legacy_callback') AND COALESCE(original.chat_type,evidence.chat_type) IN ('group','supergroup') AND COALESCE(original.chat_id,evidence.chat_id) IS NOT NULL
          THEN 'group:'||f.token_id||':'||COALESCE(original.chat_id,evidence.chat_id)
        WHEN o.category='auth_candidate' THEN 'auth_candidate'
        WHEN o.category='referral_unknown' THEN 'referral_unknown'
        WHEN o.marker IS NOT NULL THEN 'observed:'||o.marker
        WHEN o.category='no_marker' THEN 'no_marker'
        WHEN f.observed_tag IS NOT NULL AND f.observed_tag NOT LIKE 'link_%' AND f.attribution_status NOT IN ('auth_candidate','site_login','referral_unknown')
          THEN 'observed:'||f.observed_tag
        WHEN (original.kind='message_in' AND original.directed OR evidence.reason='legacy_callback') AND COALESCE(original.chat_type,evidence.chat_type)='private'
          AND f.observed_tag IS NULL AND f.attribution_status IN ('unknown','no_marker') THEN 'no_marker'
        ELSE f.attribution_status END) source_key,
      CASE WHEN (original.kind='callback' AND original.directed OR evidence.reason='legacy_callback') AND COALESCE(original.chat_type,evidence.chat_type) IN ('group','supergroup') AND COALESCE(original.chat_id,evidence.chat_id) IS NOT NULL
        THEN 'Группа · '||COALESCE(NULLIF(group_info.name,''),original.chat_id,evidence.chat_id) END source_label
    FROM firsts f LEFT JOIN analytics_events_v2 original ON original.id=f.first_event_id
    LEFT JOIN analytics_audience_evidence_v2 evidence ON evidence.id=f.legacy_evidence_id AND f.first_event_id IS NULL
    LEFT JOIN analytics_start_observations_v2 o ON o.project_id=f.project_id AND o.token_id=f.token_id
      AND o.user_id=f.user_id AND (o.event_key=original.event_key
        OR f.first_event_id IS NULL AND o.legacy_message_id=evidence.legacy_message_id)
    LEFT JOIN LATERAL (SELECT g.name FROM bot_groups g WHERE g.project_id=f.project_id AND g.token_id=f.token_id
      AND g.group_id=COALESCE(original.chat_id,evidence.chat_id) ORDER BY g.updated_at DESC NULLS LAST,g.id DESC LIMIT 1) group_info ON true
  ), source_names AS (
    SELECT DISTINCT ON(source_key) source_key,source_label FROM source_firsts
      WHERE source_key LIKE 'group:%' ORDER BY source_key,token_id
  ), source_entries AS (
    SELECT e.user_id,e.occurred_at,e.token_id,e.event_key,COALESCE(e.source_id::text,
      CASE WHEN e.observed_tag IS NOT NULL AND e.observed_tag NOT LIKE 'link_%' AND e.attribution_status NOT IN ('auth_candidate','site_login','referral_unknown')
        THEN 'observed:'||e.observed_tag ELSE e.attribution_status END) source_key
    FROM events e WHERE e.directed AND e.metadata->>'entry'='true'
    UNION ALL
    SELECT o.user_id,o.observed_at,o.token_id,o.event_key,CASE WHEN o.category='marker' THEN 'observed:'||o.marker ELSE o.category END
    FROM analytics_start_observations_v2 o
    WHERE o.project_id=$1 AND ($2::integer IS NULL OR o.token_id=$2)
      AND o.observed_at >= $3::timestamptz AND o.observed_at < $4::timestamptz
      AND EXISTS(SELECT 1 FROM firsts f WHERE f.user_id=o.user_id)
      AND NOT EXISTS(SELECT 1 FROM events e WHERE e.token_id=o.token_id AND e.event_key=o.event_key AND e.directed AND e.metadata->>'entry'='true')
  )`;
}
