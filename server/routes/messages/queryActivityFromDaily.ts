/**
 * @fileoverview Запросы активности сообщений из дневных агрегатов (granularity 1w/1d/7d/30d)
 * @module server/routes/messages/queryActivityFromDaily
 */

import type { Pool } from "pg";

/** Гранулярности из дневных агрегатов */
export type DailyActivityGranularity = "1w" | "1d" | "7d" | "30d";

/** Конфиг окна для длинных гранулярностей */
const DAILY_GRANULARITY_CONFIG: Record<
  DailyActivityGranularity,
  { window: string; truncate: string; step: string }
> = {
  "1w": { window: "7 days", truncate: "day", step: "1 day" },
  "1d": { window: "30 days", truncate: "day", step: "1 day" },
  "7d": { window: "91 days", truncate: "week", step: "1 week" },
  "30d": { window: "365 days", truncate: "month", step: "1 month" },
};

/**
 * Проверяет, читать ли активность из дневных агрегатов
 * @param granularity - Значение query granularity
 * @returns true для 1w / 1d / 7d / 30d
 */
export function isDailyActivityGranularity(
  granularity: string,
): granularity is DailyActivityGranularity {
  return (
    granularity === "1w" ||
    granularity === "1d" ||
    granularity === "7d" ||
    granularity === "30d"
  );
}

/** Точка без разбивки */
export interface ActivityCountPoint {
  /** ISO-дата слота */
  date: string;
  /** Сумма сообщений */
  count: number;
}

/** Точка с разбивкой входящие/исходящие */
export interface ActivitySplitPoint {
  /** ISO-дата слота */
  date: string;
  /** Входящие (user) */
  incoming: number;
  /** Исходящие (bot) */
  outgoing: number;
}

/**
 * Строит точки активности из message_activity_daily с заполнением пустых слотов
 * @param pool - Пул PostgreSQL
 * @param projectId - ID проекта
 * @param tokenId - ID токена или null
 * @param granularity - 1w | 1d | 7d | 30d
 * @param split - Разбивка incoming/outgoing
 * @returns Массив точек count или split
 */
export async function queryActivityFromDaily(
  pool: Pool,
  projectId: number,
  tokenId: number | null,
  granularity: DailyActivityGranularity,
  split: boolean,
): Promise<ActivityCountPoint[] | ActivitySplitPoint[]> {
  const cfg = DAILY_GRANULARITY_CONFIG[granularity];
  const selectExtra = split
    ? `SUM(incoming_count)::bigint AS incoming, SUM(outgoing_count)::bigint AS outgoing`
    : `SUM(incoming_count + outgoing_count)::bigint AS cnt`;
  const resultSelect = split
    ? `COALESCE(m.incoming, 0) AS incoming, COALESCE(m.outgoing, 0) AS outgoing`
    : `COALESCE(m.cnt, 0) AS count`;

  const result = await pool.query(
    `
    WITH series AS (
      SELECT generate_series(
        DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}'),
        DATE_TRUNC('${cfg.truncate}', NOW()),
        INTERVAL '${cfg.step}'
      ) AS slot
    ),
    msgs AS (
      SELECT
        DATE_TRUNC('${cfg.truncate}', day::timestamp) AS slot,
        ${selectExtra}
      FROM message_activity_daily
      WHERE project_id = $1
        AND ($2::integer IS NULL OR token_id = $2)
        AND day >= (NOW() - INTERVAL '${cfg.window}')::date
      GROUP BY 1
    )
    SELECT s.slot AS date, ${resultSelect}
    FROM series s
    LEFT JOIN msgs m ON m.slot = s.slot
    ORDER BY s.slot ASC
    `,
    [projectId, tokenId],
  );

  if (split) {
    return result.rows.map((row) => ({
      date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
      incoming: Number(row.incoming),
      outgoing: Number(row.outgoing),
    }));
  }

  return result.rows.map((row) => ({
    date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
    count: Number(row.count),
  }));
}
