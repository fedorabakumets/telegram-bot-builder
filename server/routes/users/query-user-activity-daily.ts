/**
 * @fileoverview Активность пользователей из дневных отметок (1w/1d/7d/30d)
 * @module server/routes/users/query-user-activity-daily
 */

import type { Pool } from "pg";
import {
  toUserActivityPoint,
  type UserActivityResponse,
} from "./user-activity-types";

/** Гранулярности из дневных отметок */
export type DailyUserActivityGranularity = "1w" | "1d" | "7d" | "30d";

/** Окна и шаги для длинных периодов */
const DAILY_CONFIG: Record<
  DailyUserActivityGranularity,
  { window: string; truncate: string; step: string }
> = {
  "1w": { window: "7 days", truncate: "day", step: "1 day" },
  "1d": { window: "30 days", truncate: "day", step: "1 day" },
  "7d": { window: "91 days", truncate: "week", step: "1 week" },
  "30d": { window: "365 days", truncate: "month", step: "1 month" },
};

/**
 * Проверяет, читать ли активность из дневных отметок
 * @param granularity - Значение query granularity
 * @returns true для 1w / 1d / 7d / 30d
 */
export function isDailyUserActivityGranularity(
  granularity: string,
): granularity is DailyUserActivityGranularity {
  return (
    granularity === "1w" ||
    granularity === "1d" ||
    granularity === "7d" ||
    granularity === "30d"
  );
}

/**
 * Строит точки и итоги из user_activity_daily
 * @param pool - Пул PostgreSQL
 * @param projectId - ID проекта
 * @param tokenId - ID токена или null
 * @param granularity - 1w | 1d | 7d | 30d
 * @returns Ответ с точками и итогами окна
 */
export async function queryUserActivityFromDaily(
  pool: Pool,
  projectId: number,
  tokenId: number | null,
  granularity: DailyUserActivityGranularity,
): Promise<UserActivityResponse> {
  const cfg = DAILY_CONFIG[granularity];

  const pointsResult = await pool.query(
    `
    WITH series AS (
      SELECT generate_series(
        DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}'),
        DATE_TRUNC('${cfg.truncate}', NOW()),
        INTERVAL '${cfg.step}'
      ) AS slot
    ),
    acts AS (
      SELECT
        DATE_TRUNC('${cfg.truncate}', day::timestamp) AS slot,
        COUNT(DISTINCT user_id)::int AS total,
        COUNT(DISTINCT user_id) FILTER (
          WHERE DATE_TRUNC('${cfg.truncate}', first_seen_at)
              = DATE_TRUNC('${cfg.truncate}', day::timestamp)
        )::int AS newcomers
      FROM user_activity_daily
      WHERE project_id = $1
        AND ($2::integer IS NULL OR token_id = $2)
        AND day >= (NOW() - INTERVAL '${cfg.window}')::date
      GROUP BY 1
    )
    SELECT s.slot AS date,
           COALESCE(a.total, 0) AS total,
           COALESCE(a.newcomers, 0) AS newcomers
    FROM series s
    LEFT JOIN acts a ON a.slot = s.slot
    ORDER BY s.slot ASC
    `,
    [projectId, tokenId],
  );

  const totalsResult = await pool.query(
    `
    SELECT
      COUNT(DISTINCT user_id)::int AS active,
      COUNT(DISTINCT user_id) FILTER (
        WHERE first_seen_at >= NOW() - INTERVAL '${cfg.window}'
      )::int AS newcomers
    FROM user_activity_daily
    WHERE project_id = $1
      AND ($2::integer IS NULL OR token_id = $2)
      AND day >= (NOW() - INTERVAL '${cfg.window}')::date
    `,
    [projectId, tokenId],
  );

  const points = pointsResult.rows.map((row) =>
    toUserActivityPoint(
      row.date instanceof Date ? row.date.toISOString() : String(row.date),
      row.total,
      row.newcomers,
    ),
  );

  return {
    points,
    activeInWindow: Number(totalsResult.rows[0]?.active) || 0,
    newInWindow: Number(totalsResult.rows[0]?.newcomers) || 0,
  };
}
