/**
 * @fileoverview Активность пользователей из bot_messages (1m/5m/1h)
 * @module server/routes/users/query-user-activity-recent
 */

import type { Pool } from "pg";
import {
  toUserActivityPoint,
  type UserActivityResponse,
} from "./user-activity-types";

/** Параметры короткого окна */
interface RecentWindow {
  /** INTERVAL окна */
  window: string;
  /** Единица DATE_TRUNC (null для 5m) */
  truncate: string | null;
  /** Шаг generate_series */
  step: string;
}

/** Конфиг коротких гранулярностей */
const RECENT: Record<string, RecentWindow> = {
  "1m": { window: "1 hour", truncate: "minute", step: "1 minute" },
  "5m": { window: "3 hours", truncate: null, step: "5 minutes" },
  "1h": { window: "24 hours", truncate: "hour", step: "1 hour" },
};

/**
 * SQL-выражение слота для timestamp-колонки
 * @param col - Имя колонки
 * @param gran - 1m | 5m | 1h
 * @returns SQL-выражение
 */
function slotOf(col: string, gran: string): string {
  if (gran === "5m") {
    return `DATE_TRUNC('hour', ${col}) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM ${col}) / 5)`;
  }
  const trunc = gran === "1m" ? "minute" : "hour";
  return `DATE_TRUNC('${trunc}', ${col})`;
}

/**
 * Строит точки и итоги из входящих сообщений за короткое окно
 * @param pool - Пул PostgreSQL
 * @param projectId - ID проекта
 * @param tokenId - ID токена или null
 * @param granularity - 1m | 5m | 1h
 * @returns Ответ с точками и итогами окна
 */
export async function queryUserActivityRecent(
  pool: Pool,
  projectId: number,
  tokenId: number | null,
  granularity: string,
): Promise<UserActivityResponse> {
  const gran = RECENT[granularity] ? granularity : "1h";
  const cfg = RECENT[gran];
  const msgSlot = slotOf("bm.created_at", gran);
  const seenCol = "COALESCE(bu.registered_at, bm.created_at)";
  const seenSlot = slotOf(seenCol, gran);

  const seriesStart =
    gran === "5m"
      ? `DATE_TRUNC('hour', NOW() - INTERVAL '${cfg.window}')`
      : `DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}')`;
  const seriesEnd =
    gran === "5m"
      ? `DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes'`
      : `DATE_TRUNC('${cfg.truncate}', NOW())`;

  const pointsResult = await pool.query(
    `
    WITH series AS (
      SELECT generate_series(
        ${seriesStart}, ${seriesEnd}, INTERVAL '${cfg.step}'
      ) AS slot
    ),
    acts AS (
      SELECT
        ${msgSlot} AS slot,
        COUNT(DISTINCT bm.user_id)::int AS total,
        COUNT(DISTINCT bm.user_id) FILTER (
          WHERE ${seenSlot} = ${msgSlot}
        )::int AS newcomers
      FROM bot_messages bm
      LEFT JOIN bot_users bu
        ON bu.project_id = bm.project_id
       AND bu.token_id = COALESCE(bm.token_id, 0)
       AND bu.user_id::text = bm.user_id
      WHERE bm.project_id = $1
        AND ($2::integer IS NULL OR bm.token_id = $2)
        AND bm.message_type = 'user'
        AND bm.created_at >= NOW() - INTERVAL '${cfg.window}'
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
      COUNT(DISTINCT bm.user_id)::int AS active,
      COUNT(DISTINCT bm.user_id) FILTER (
        WHERE ${seenCol} >= NOW() - INTERVAL '${cfg.window}'
      )::int AS newcomers
    FROM bot_messages bm
    LEFT JOIN bot_users bu
      ON bu.project_id = bm.project_id
     AND bu.token_id = COALESCE(bm.token_id, 0)
     AND bu.user_id::text = bm.user_id
    WHERE bm.project_id = $1
      AND ($2::integer IS NULL OR bm.token_id = $2)
      AND bm.message_type = 'user'
      AND bm.created_at >= NOW() - INTERVAL '${cfg.window}'
    `,
    [projectId, tokenId],
  );

  return {
    points: pointsResult.rows.map((row) =>
      toUserActivityPoint(
        row.date instanceof Date ? row.date.toISOString() : String(row.date),
        row.total,
        row.newcomers,
      ),
    ),
    activeInWindow: Number(totalsResult.rows[0]?.active) || 0,
    newInWindow: Number(totalsResult.rows[0]?.newcomers) || 0,
  };
}
