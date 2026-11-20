/** @fileoverview Источник первого физического либо аудированного исторического действия: метка, группа либо личное сообщение без метки; рекламная атрибуция сохраняется отдельно. */
import { firstSourceKeySql, firstSourceGroupLabelSql, firstSourceJoinsSql } from './first-source-sql';
/**
 * Добавляет наблюдаемые источники и входы к общим CTE снимка.
 * @returns Статический SQL с областью $1/$2 и границами $3/$4.
 */
export function v2SourceOriginsSql(): string {
  return `source_firsts AS (
    SELECT f.*,${firstSourceKeySql} source_key,
      ${firstSourceGroupLabelSql} source_label
    FROM firsts f ${firstSourceJoinsSql}
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
