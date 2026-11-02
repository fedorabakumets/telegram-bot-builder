/**
 * @fileoverview Уникальные группы проекта или одного бота и дата их первого сохранения.
 * @module server/routes/analytics/groups-analytics-query
 */
import type { Pool } from 'pg';
import { getChartSeriesGranularity } from '../messages/chart-granularity-config';

/** Счётчики групп одного бота. */
export interface GroupsAnalyticsStats {
  /** Всего групп и супергрупп в справочнике. */
  totalGroups: number;
  /** Проверка доступа: бот в чате. */
  availableGroups: number;
  /** Проверка доступа: бота исключили. */
  kickedGroups: number;
  /** Впервые сохранены за последние 7 дней. */
  addedLast7Days: number;
}

/** Точка графика: сколько групп впервые сохранилось в отрезке. */
export interface GroupsGrowthPoint {
  /** Начало отрезка в ISO. */
  date: string;
  /** Число новых строк справочника. */
  count: number;
}

/** Общая область групп: одна запись на чат, самая ранняя дата и доступ хотя бы одного бота. */
const GROUPS_SCOPE_SQL = `
  SELECT g.group_id, MIN(g.created_at) AS created_at,
    BOOL_OR(a.status = 'available') AS available,
    BOOL_AND(COALESCE(a.status = 'kicked', FALSE)) AS kicked
  FROM bot_groups g
  LEFT JOIN chat_access a
    ON a.project_id = g.project_id AND a.token_id = g.token_id AND a.chat_id = g.group_id
  WHERE g.project_id = $1 AND ($2::integer IS NULL OR g.token_id = $2)
    AND g.group_id IS NOT NULL AND g.chat_type IN ('group', 'supergroup')
  GROUP BY g.group_id
`;

/**
 * Считает группы, доступные и исключённые.
 * @param pool - Пул базы
 * @param projectId - Проект
 * @param tokenId - Бот или весь проект при отсутствии фильтра
 * @returns Сводка
 */
export async function queryGroupsStats(pool: Pool, projectId: number, tokenId: number | null): Promise<GroupsAnalyticsStats> {
  const result = await pool.query(`
    WITH scoped AS (${GROUPS_SCOPE_SQL})
    SELECT COUNT(*)::int AS "totalGroups",
      COUNT(*) FILTER (WHERE available)::int AS "availableGroups",
      COUNT(*) FILTER (WHERE kicked)::int AS "kickedGroups",
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS "addedLast7Days"
    FROM scoped
  `, [projectId, tokenId]);
  const row = result.rows[0] ?? {};
  return {
    totalGroups: Number(row.totalGroups ?? 0),
    availableGroups: Number(row.availableGroups ?? 0),
    kickedGroups: Number(row.kickedGroups ?? 0),
    addedLast7Days: Number(row.addedLast7Days ?? 0),
  };
}

/**
 * Строит ряд первого сохранения групп по тем же отрезкам, что у пользователей.
 * @param pool - Пул базы
 * @param projectId - Проект
 * @param tokenId - Бот или весь проект при отсутствии фильтра
 * @param granularity - Ключ периода
 * @returns Точки от старых к новым
 */
export async function queryGroupsGrowth(
  pool: Pool, projectId: number, tokenId: number | null, granularity: string | undefined,
): Promise<GroupsGrowthPoint[]> {
  const cfg = getChartSeriesGranularity(granularity);
  const five = granularity === '5m';
  const slot = five
    ? "DATE_TRUNC('hour', g.created_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM g.created_at) / 5)"
    : `DATE_TRUNC('${cfg.truncate}', g.created_at)`;
  const seriesFrom = five ? 'hour' : cfg.truncate;
  const seriesTo = five
    ? "DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes'"
    : `DATE_TRUNC('${cfg.truncate}', NOW())`;
  const result = await pool.query(`
    WITH scoped AS (${GROUPS_SCOPE_SQL}), series AS (
      SELECT generate_series(
        DATE_TRUNC('${seriesFrom}', NOW() - INTERVAL '${cfg.window}'),
        ${seriesTo},
        INTERVAL '${cfg.step}'
      ) AS slot
    ),
    groups AS (
      SELECT ${slot} AS slot, COUNT(*) AS cnt
      FROM scoped g
      WHERE g.created_at >= NOW() - INTERVAL '${cfg.window}'
      GROUP BY 1
    )
    SELECT s.slot AS date, COALESCE(u.cnt, 0) AS count
    FROM series s
    LEFT JOIN groups u ON u.slot = s.slot
    ORDER BY s.slot ASC
  `, [projectId, tokenId]);
  return result.rows.map((row) => ({
    date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
    count: Number(row.count),
  }));
}
