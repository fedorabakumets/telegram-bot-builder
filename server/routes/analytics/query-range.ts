/** @fileoverview Ограниченные параметризованные временные ряды и уникальные итоги. */
import type { PoolClient } from 'pg';
import { ANALYTICS_STEPS, type resolveAnalyticsRange } from '../../../shared/analytics/range';
import { rangeEvents, type RANGE_METRICS } from './range-events';
/** Нормализованное окно аналитики. */
export type ResolvedRange = ReturnType<typeof resolveAnalyticsRange>;
/**
 * Проверяет возможность точного использования дневных агрегатов.
 * @param range - Границы окна и шаг.
 * @returns Начинаются ли обе границы в полночь UTC и шаг не меньше дня.
 */
export function supportsDailyRange(range: ResolvedRange): boolean {
  return [range.from, range.to].every(date => Date.parse(date) % 86400000 === 0) && ANALYTICS_STEPS[range.step] >= 86400000;
}
/**
 * Читает точки и итоги из одного SQL-оператора в общем снимке транзакции.
 * @param client - Соединение транзакции с часовым поясом UTC.
 * @param projectId - Проект с проверенным доступом.
 * @param tokenId - Необязательный токен проекта.
 * @param metric - Метрика из белого списка.
 * @param range - Точные включённая и исключённая границы.
 * @param daily - Единый источник для текущего и предыдущего окон.
 * @returns Точки и сводка без суммы уникальных по дням.
 */
export async function queryAnalyticsRange(client: PoolClient, projectId: number, tokenId: number | null,
  metric: typeof RANGE_METRICS[number], range: ResolvedRange, daily: boolean) {
  const events = rangeEvents(metric, daily);
  const unique = metric === 'active_users';
  const total = unique ? 'COUNT(DISTINCT uid)' : 'COALESCE(SUM(amount),0)';
  const newcomers = unique ? 'COUNT(DISTINCT uid) FILTER (WHERE first_seen >= $3::timestamp AND first_seen < $4::timestamp)' : '0';
  const pointNewcomers = unique ? 'COUNT(DISTINCT uid) FILTER (WHERE first_seen >= slot AND first_seen < LEAST(slot + $5::bigint * INTERVAL \'1 millisecond\', $4::timestamp))' : '0';
  const result = await client.query(`WITH events AS (${events.sql}),
    selected AS (SELECT *, $3::timestamp + FLOOR(EXTRACT(EPOCH FROM (at - $3::timestamp)) * 1000 / $5::bigint) * $5::bigint * INTERVAL '1 millisecond' AS slot FROM events WHERE at >= $3::timestamp AND at < $4::timestamp),
    buckets AS (SELECT slot, ${total} AS count, COALESCE(SUM(incoming),0) AS incoming, COALESCE(SUM(outgoing),0) AS outgoing, ${pointNewcomers} AS newcomers FROM selected GROUP BY slot),
    series AS (SELECT generate_series($3::timestamp, $4::timestamp - INTERVAL '1 millisecond', $5::bigint * INTERVAL '1 millisecond') AS slot),
    points AS (SELECT s.slot AS date, COALESCE(b.count,0) AS count, COALESCE(b.incoming,0) AS incoming, COALESCE(b.outgoing,0) AS outgoing, COALESCE(b.newcomers,0) AS newcomers FROM series s LEFT JOIN buckets b USING(slot)),
    summary AS (SELECT ${total} AS count, COALESCE(SUM(incoming),0) AS incoming, COALESCE(SUM(outgoing),0) AS outgoing, ${newcomers} AS newcomers FROM selected)
    SELECT (SELECT row_to_json(summary) FROM summary) AS summary, (SELECT json_agg(points ORDER BY date) FROM points) AS points`,
    [projectId, tokenId, range.from, range.to, ANALYTICS_STEPS[range.step]]);
  const row = result.rows[0];
  /** Преобразует числовые SQL-счётчики без потери точности. */
  const count = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error('Некорректный счётчик аналитики');
    return parsed;
  };
  /** Нормализует одну группу счётчиков. */
  const counters = (item: Record<string, unknown>) => ({ count: count(item.count), incoming: count(item.incoming), outgoing: count(item.outgoing), newcomers: count(item.newcomers) });
  return { ...range, metric, source: events.source, retention_description: events.retention,
    summary: counters(row.summary), points: (row.points ?? []).map((point: Record<string, unknown>) => ({ date: new Date(`${String(point.date).replace(' ', 'T')}Z`).toISOString(), ...counters(point) })) };
}
