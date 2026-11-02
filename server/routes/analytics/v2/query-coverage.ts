/** @fileoverview Полнота новой аналитики и границы восстановления после старых сборок. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Range, AnalyticsV2Snapshot } from '../../../../shared/analytics/v2';
import { v2Count } from './query-scope';
import { v2HistoryTimesSql } from './query-history-times';
/**
 * Определяет покрытие всех выбранных ботов и неизвестные старые профили.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Фильтр бота.
 * @param range - Проверяемое окно.
 * @returns Честное описание покрытия без замены отсутствия данных нулём.
 */
export async function queryV2Coverage(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range): Promise<AnalyticsV2Snapshot['coverage']> {
  const { rows } = await client.query(`SELECT t.id token_id,r.coverage_from,r.version FROM bot_tokens t
    LEFT JOIN analytics_runtime_v2 r ON r.project_id=t.project_id AND r.token_id=t.id
    WHERE t.project_id=$1 AND ($2::integer IS NULL OR t.id=$2) ORDER BY t.id`, [project, token]);
  const { rows: [legacy] } = await client.query(`SELECT COUNT(DISTINCT user_id) count FROM (
    SELECT user_id FROM analytics_legacy_people_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
    UNION SELECT user_id FROM analytics_audience_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2) AND NOT first_known
  ) unknown_people`, [project, token]);
  const { rows: [history] } = await client.query(`SELECT EXISTS(SELECT 1 FROM (${v2HistoryTimesSql()}) times) present`, [project, token]);
  const bots = rows.map(row => ({ token_id: row.token_id, from: row.coverage_from ? new Date(row.coverage_from).toISOString() : null, version: Number(row.version ?? 0) }));
  const starts = bots.flatMap(bot => bot.from ? [Date.parse(bot.from)] : []);
  const from = starts.length ? new Date(Math.max(...starts)).toISOString() : null;
  const complete = starts.length === bots.length && bots.length > 0 && starts.every(date => date <= Date.parse(range.from));
  const status = !starts.length && !history.present ? 'unavailable' : complete ? 'complete' : 'partial';
  return { status, from, bots, legacy_unknown_users: v2Count(legacy.count), description: status === 'complete'
    ? 'События сохранены за весь выбранный период. Старые свидетельства контакта показаны отдельно: они не доказывают новое привлечение или число физических нажатий.'
    : status === 'unavailable' ? 'Подтверждённая аналитика ещё не включена в работающих ботах. Обновите и перезапустите их сборки.'
      : 'История периода неполная. Даты первых сохранённых свидетельств контакта показаны как восстановленные; они не доказывают первое использование и не входят в цену привлечения. Исторические свидетельства без Telegram ID не увеличивают число сообщений и нажатий. Ноль подтверждённых новых пользователей не означает отсутствия прихода.' };
}
/**
 * Находит ближайший выход события из текущего или сравниваемого скользящего окна.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Бот.
 * @param range - Скользящее окно.
 * @param compare - Учитывается ли предыдущее окно.
 * @returns Время следующего содержательного пересчёта либо null.
 */
export async function queryV2NextChange(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range, compare: boolean): Promise<string | null> {
  if (!range.period) return null;
  if (range.period === 'all') {
    const { rows: [future] } = await client.query(`SELECT MIN(occurred_at) at FROM (${v2HistoryTimesSql()}) history
      WHERE occurred_at >= $3::timestamptz`, [project, token, range.to]);
    return future.at ? new Date(future.at).toISOString() : null;
  }
  const duration = Date.parse(range.to) - Date.parse(range.from);
  const { rows: [row] } = await client.query(`WITH history AS (${v2HistoryTimesSql()}) SELECT MIN(change_at) at FROM (
    SELECT MIN(occurred_at)+$5::bigint*INTERVAL '1 millisecond'+INTERVAL '1 millisecond' change_at FROM history
      WHERE occurred_at >= $3::timestamptz AND occurred_at<$4::timestamptz
    UNION ALL SELECT MIN(occurred_at)+2*$5::bigint*INTERVAL '1 millisecond'+INTERVAL '1 millisecond' FROM history
      WHERE $6::boolean AND occurred_at >= $3::timestamptz-$5::bigint*INTERVAL '1 millisecond' AND occurred_at<$3::timestamptz
    UNION ALL SELECT MIN(occurred_at) FROM history WHERE occurred_at >= $4::timestamptz
  ) changes`, [project, token, range.from, range.to, duration, compare]);
  return row.at ? new Date(row.at).toISOString() : null;
}
