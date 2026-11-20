/** @fileoverview Единые наблюдаемые источники первого контакта для аналитики и пользователей. */
/** Ключ источника учитывает событие, историческое свидетельство и наблюдение запуска. */
export const firstSourceKeySql = `COALESCE(f.source_id::text,
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
        ELSE f.attribution_status END)`;
/** Название группы первого подтверждённого нажатия. */
export const firstSourceGroupLabelSql = `CASE WHEN (original.kind='callback' AND original.directed OR evidence.reason='legacy_callback') AND COALESCE(original.chat_type,evidence.chat_type) IN ('group','supergroup') AND COALESCE(original.chat_id,evidence.chat_id) IS NOT NULL
        THEN 'Группа · '||COALESCE(NULLIF(group_info.name,''),original.chat_id,evidence.chat_id) END`;
/** Соединения для строки аудитории с псевдонимом f. */
export const firstSourceJoinsSql = `LEFT JOIN analytics_events_v2 original ON original.id=f.first_event_id
    LEFT JOIN analytics_audience_evidence_v2 evidence ON evidence.id=f.legacy_evidence_id AND f.first_event_id IS NULL
    LEFT JOIN analytics_start_observations_v2 o ON o.project_id=f.project_id AND o.token_id=f.token_id
      AND o.user_id=f.user_id AND (o.event_key=original.event_key
        OR f.first_event_id IS NULL AND o.legacy_message_id=evidence.legacy_message_id)
    LEFT JOIN LATERAL (SELECT g.name FROM bot_groups g WHERE g.project_id=f.project_id AND g.token_id=f.token_id
      AND g.group_id=COALESCE(original.chat_id,evidence.chat_id) ORDER BY g.updated_at DESC NULLS LAST,g.id DESC LIMIT 1) group_info ON true`;
/** Общие подписи служебных источников без раскрытия технических параметров. */
export const firstSourceFallbackSql = `CASE origin.key
 WHEN 'no_marker' THEN 'Без источника' WHEN 'unknown' THEN 'Источник неизвестен'
 WHEN 'referral_unknown' THEN 'Реферальный переход без пригласившего'
 WHEN 'site_login' THEN 'Вход с сайта' WHEN 'auth_candidate' THEN 'Авторизация на сайте'
 WHEN 'resolved' THEN 'Источник' ELSE CASE WHEN origin.key LIKE 'observed:%' THEN substr(origin.key,10) ELSE 'Источник '||origin.key END END`;
