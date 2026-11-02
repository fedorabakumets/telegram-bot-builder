/** @fileoverview Итоги подтверждённой аудитории, сообщений и групп для одного общего окна. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Range, AnalyticsV2Summary, AnalyticsV2HistoryStatus } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
/**
 * Читает сводку с уникальными людьми за весь интервал.
 * @param client - Соединение согласованного снимка.
 * @param project - Проверенный проект.
 * @param token - Бот или весь проект.
 * @param range - Точные границы.
 * @param coverage - Полнота записи событий выбранного окна.
 * @returns Сводные показатели.
 */
export async function queryV2Summary(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range, coverage: AnalyticsV2HistoryStatus): Promise<AnalyticsV2Summary> {
  const { rows: [row] } = await client.query(`${v2ScopeSql()}
    SELECT (SELECT COUNT(*) FROM firsts) total_users,
      (SELECT COUNT(*) FROM firsts WHERE known AND first_interaction_at >= $3::timestamptz AND first_interaction_at<$4::timestamptz) new_users,
      (SELECT COUNT(*) FROM firsts WHERE NOT known AND first_interaction_at >= $3::timestamptz AND first_interaction_at<$4::timestamptz) restored_users,
      (SELECT COUNT(*) FROM firsts WHERE NOT known) unknown_first_users,
      (SELECT COUNT(DISTINCT user_id) FROM contacts) active_users,
      (SELECT COUNT(DISTINCT c.user_id) FROM contacts c JOIN firsts f ON f.user_id=c.user_id WHERE f.first_interaction_at<$3::timestamptz) returning_users,
      COUNT(*) FILTER(WHERE kind='message_in') incoming,
      COUNT(*) FILTER(WHERE kind='message_out') outgoing,
      COUNT(*) FILTER(WHERE kind='callback') callbacks,
      COUNT(*) FILTER(WHERE kind='system') system,
      COUNT(DISTINCT chat_id) FILTER(WHERE chat_type IN ('group','supergroup')) active_groups,
      COUNT(DISTINCT e.user_id) FILTER(WHERE kind='message_in' AND chat_type IN ('group','supergroup')) participants,
      COUNT(*) FILTER(WHERE directed AND chat_type IN ('group','supergroup')) directed_actions
    FROM events e LEFT JOIN firsts f ON f.user_id=e.user_id`, [project, token, range.from, range.to]);
  /** Считывает один проверенный счётчик результата. */
  const n = (key: string) => v2Count(row[key]);
  return {
    audience: { new_users: n('new_users'), restored_users: n('restored_users'), first_history_status: n('restored_users') > 0 ? 'partial' : coverage,
      total_users: n('total_users'), active_users: n('active_users'), returning_users: n('returning_users'), unknown_first_users: n('unknown_first_users') },
    messages: { incoming: n('incoming'), outgoing: n('outgoing'), callbacks: n('callbacks'), system: n('system'), total: n('incoming') + n('outgoing') },
    groups: { active_groups: n('active_groups'), participants: n('participants'), directed_actions: n('directed_actions') },
  };
}
