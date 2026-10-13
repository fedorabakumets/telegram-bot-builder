/** @fileoverview Проверенные SQL-источники временных метрик с описанием хранения. */
/** Допустимые временные метрики. */
export const RANGE_METRICS = ['registrations', 'messages', 'active_users'] as const;
/**
 * Выбирает SQL событий и единый источник для обоих сравниваемых диапазонов.
 * @param metric - Проверенная метрика.
 * @param daily - Доступна ли точная дневная выборка.
 * @returns Запрос событий и ограничения истории.
 */
export function rangeEvents(metric: typeof RANGE_METRICS[number], daily: boolean) {
  const scope = 'project_id = $1 AND ($2::integer IS NULL OR token_id = $2)';
  const profiles = `(SELECT user_id::text AS uid, MIN(registered_at) AS first_seen FROM bot_users WHERE ${scope} GROUP BY user_id::text)`;
  if (metric === 'registrations') return {
    sql: `SELECT registered_at AS at, user_id::text AS uid, registered_at AS first_seen, 1::bigint AS amount, 0::bigint AS incoming, 0::bigint AS outgoing FROM bot_users WHERE ${scope}`,
    source: 'bot_users', retention: 'Текущие записи пользователей; удалённые регистрации не восстанавливаются. Один человек у разных ботов учитывается повторно.',
  };
  if (metric === 'messages' && daily) return {
    sql: `SELECT day::timestamp AS at, NULL::text AS uid, NULL::timestamp AS first_seen, (incoming_count::bigint + outgoing_count::bigint) AS amount, incoming_count::bigint AS incoming, outgoing_count::bigint AS outgoing FROM message_activity_daily WHERE ${scope}`,
    source: 'message_activity_daily', retention: 'Дневные агрегаты сохраняются после очистки сообщений. История до начала ведения агрегатов может отсутствовать.',
  };
  if (metric === 'active_users' && daily) return {
    sql: `SELECT d.day::timestamp AS at, d.user_id::text AS uid, COALESCE(p.first_seen, MIN(d.first_seen_at) OVER (PARTITION BY d.user_id)) AS first_seen, 1::bigint AS amount, 0::bigint AS incoming, 0::bigint AS outgoing FROM user_activity_daily d LEFT JOIN ${profiles} p ON p.uid = d.user_id::text WHERE d.project_id = $1 AND ($2::integer IS NULL OR d.token_id = $2)`,
    source: 'user_activity_daily', retention: 'Дневные отметки сохраняются после очистки сообщений. Уникальные user_id за всё окно считаются отдельно от точек.',
  };
  return {
    sql: `SELECT m.created_at AS at, m.user_id::text AS uid, COALESCE(p.first_seen, MIN(m.created_at) OVER (PARTITION BY m.user_id)) AS first_seen, 1::bigint AS amount, CASE WHEN m.message_type = 'user' THEN 1 ELSE 0 END::bigint AS incoming, CASE WHEN m.message_type = 'user' THEN 0 ELSE 1 END::bigint AS outgoing FROM bot_messages m LEFT JOIN ${profiles} p ON p.uid = m.user_id WHERE m.project_id = $1 AND ($2::integer IS NULL OR m.token_id = $2) ${metric === 'active_users' ? "AND m.message_type = 'user'" : ''}`,
    source: 'bot_messages', retention: 'Точные внутридневные границы используют сохранённые сообщения; очистка истории уменьшает значения. Ноль может означать отсутствие сохранённой истории.',
  };
}
