/** @fileoverview Итоги подтверждённой аудитории, сообщений и групп для одного общего окна. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Range, AnalyticsV2Summary, AnalyticsV2HistoryStatus } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
import { messageScopeSql, messageScope } from './query-message-scope';
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
      COUNT(*) FILTER(WHERE kind='message_in' AND (chat_type='private' OR chat_type IN ('group','supergroup') AND confirmed_directed))
        + (SELECT COUNT(*) FROM addressed_only) incoming_to_bot,
      COUNT(*) FILTER(WHERE kind='message_out') outgoing,
      COUNT(*) FILTER(WHERE kind='callback') callbacks,
      ${messageScopeSql()},
      (SELECT COUNT(*) FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
        AND reason='legacy_callback' AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz) historical_callbacks,
      (SELECT COUNT(*) FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
        AND reason='legacy_callback' AND chat_type='private' AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz) private_historical_callbacks,
      (SELECT COUNT(*) FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
        AND reason='legacy_callback' AND chat_type IN ('group','supergroup') AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz) group_historical_callbacks,
      COUNT(*) FILTER(WHERE kind='system') system,
      COUNT(DISTINCT chat_id) FILTER(WHERE chat_type IN ('group','supergroup')) active_groups,
      COUNT(DISTINCT e.user_id) FILTER(WHERE kind='message_in' AND chat_type IN ('group','supergroup')) participants,
      COUNT(*) FILTER(WHERE directed AND chat_type IN ('group','supergroup')) directed_actions
    FROM events e LEFT JOIN firsts f ON f.user_id=e.user_id`, [project, token, range.from, range.to]);
  /** Считывает один проверенный счётчик результата. */
  const n = (key: string) => v2Count(row[key]);
  const group = messageScope(row, 'group');
  /** Добавляет подтверждённые свидетельства, у которых событие не сохранилось. */
  group.incoming_to_bot += n('incoming_to_bot') - messageScope(row, 'private').incoming_to_bot - group.incoming_to_bot;
  return {
    audience: { new_users: n('new_users'), restored_users: n('restored_users'), first_history_status: n('restored_users') > 0 ? 'partial' : coverage,
      total_users: n('total_users'), active_users: n('active_users'), returning_users: n('returning_users'), unknown_first_users: n('unknown_first_users') },
    messages: { incoming: n('incoming'), incoming_to_bot: n('incoming_to_bot'), outgoing: n('outgoing'), callbacks: n('callbacks'), historical_callbacks: n('historical_callbacks'), system: n('system'), total: n('incoming') + n('outgoing'),
      chat_scopes: { private: messageScope(row, 'private'), group } },
    groups: { active_groups: n('active_groups'), participants: n('participants'), directed_actions: n('directed_actions') },
  };
}
