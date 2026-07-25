/**
 * @fileoverview Legacy period-запрос активности из дневных агрегатов
 * @module server/routes/messages/queryActivityFromDailyPeriod
 */

import type { Pool } from "pg";
import type { ActivityCountPoint } from "./queryActivityFromDaily";

/**
 * Legacy period: группировка по дням из агрегатов, fallback на 90 дней если пусто
 * @param pool - Пул PostgreSQL
 * @param projectId - ID проекта
 * @param tokenId - ID токена или null
 * @param period - Период 7d | 30d | 90d
 * @returns Точки { date: YYYY-MM-DD, count }
 */
export async function queryActivityFromDailyPeriod(
  pool: Pool,
  projectId: number,
  tokenId: number | null,
  period: string,
): Promise<ActivityCountPoint[]> {
  const intervalMap: Record<string, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
  };
  const interval = intervalMap[period] ?? "30 days";

  const mapRows = (rows: Array<{ date: Date | string; count: string | number }>) =>
    rows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : String(row.date),
      count: Number(row.count),
    }));

  let result = await pool.query(
    `
    SELECT
      day AS date,
      SUM(incoming_count + outgoing_count)::bigint AS count
    FROM message_activity_daily
    WHERE project_id = $1
      AND ($2::integer IS NULL OR token_id = $2)
      AND day >= (NOW() - INTERVAL '${interval}')::date
    GROUP BY day
    ORDER BY day ASC
    `,
    [projectId, tokenId],
  );

  if (result.rows.length === 0) {
    result = await pool.query(
      `
      SELECT
        day AS date,
        SUM(incoming_count + outgoing_count)::bigint AS count
      FROM message_activity_daily
      WHERE project_id = $1
        AND ($2::integer IS NULL OR token_id = $2)
        AND day >= (NOW() - INTERVAL '90 days')::date
      GROUP BY day
      ORDER BY day ASC
      `,
      [projectId, tokenId],
    );
  }

  return mapRows(result.rows);
}
