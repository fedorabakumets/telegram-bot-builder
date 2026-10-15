/**
 * @fileoverview Сводка и ряд графика групп выбранного бота.
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

/**
 * Считает группы, доступные и исключённые.
 * @param pool - Пул базы
 * @param projectId - Проект
 * @param tokenId - Бот
 * @returns Сводка
 */
export async function queryGroupsStats(pool: Pool, projectId: number, tokenId: number): Promise<GroupsAnalyticsStats> {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS "totalGroups",
      COUNT(*) FILTER (WHERE a.status = 'available')::int AS "availableGroups",
      COUNT(*) FILTER (WHERE a.status = 'kicked')::int AS "kickedGroups",
      COUNT(*) FILTER (WHERE g.created_at >= NOW() - INTERVAL '7 days')::int AS "addedLast7Days"
    FROM bot_groups g
    LEFT JOIN chat_access a
      ON a.project_id = g.project_id AND a.token_id = g.token_id AND a.chat_id = g.group_id
    WHERE g.project_id = $1 AND g.token_id = $2
      AND g.group_id IS NOT NULL
      AND g.chat_type IN ('group', 'supergroup')
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
 * @param tokenId - Бот
 * @param granularity - Ключ периода
 * @returns Точки от старых к новым
 */
export async function queryGroupsGrowth(
  pool: Pool, projectId: number, tokenId: number, granularity: string | undefined,
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
    WITH series AS (
      SELECT generate_series(
        DATE_TRUNC('${seriesFrom}', NOW() - INTERVAL '${cfg.window}'),
        ${seriesTo},
        INTERVAL '${cfg.step}'
      ) AS slot
    ),
    groups AS (
      SELECT ${slot} AS slot, COUNT(*) AS cnt
      FROM bot_groups g
      WHERE g.project_id = $1 AND g.token_id = $2
        AND g.group_id IS NOT NULL
        AND g.chat_type IN ('group', 'supergroup')
        AND g.created_at >= NOW() - INTERVAL '${cfg.window}'
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
