/** @fileoverview Месячная динамика источников за всю историю проекта без ограничения последним годом. */
import type { Pool } from 'pg';

/** Точка истории источников. */
export interface SourceHistoryPoint {
  /** Начало месяца или года в ISO. */
  date: string;
  /** Число зарегистрированных пользователей по источникам. */
  sources: Record<string, number>;
}

/**
 * Строит полную историю, включая пустые месяцы; длиннее десяти лет использует годы.
 * @param pool - Пул запросов базы данных.
 * @param projectId - Проект с проверенными правами доступа.
 * @param tokenId - Необязательный фильтр бота.
 * @returns История от первой регистрации до текущего месяца.
 */
export async function querySourcesAllTime(pool: Pool, projectId: number, tokenId: number | null): Promise<SourceHistoryPoint[]> {
  const result = await pool.query(`
    WITH audience AS (
      SELECT registered_at, COALESCE(deep_link_param, 'direct') AS source
      FROM bot_users WHERE project_id = $1 AND ($2::integer IS NULL OR token_id = $2)
        AND registered_at <= NOW()
    ), bounds AS (
      SELECT COALESCE(MIN(registered_at), NOW()) AS first_date,
        CASE WHEN MIN(registered_at) < NOW() - INTERVAL '10 years' THEN 'year' ELSE 'month' END AS unit
      FROM audience
    ), series AS (
      SELECT generate_series(DATE_TRUNC(unit, first_date), DATE_TRUNC(unit, NOW()),
        CASE WHEN unit = 'year' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END) AS slot
      FROM bounds
    ), counts AS (
      SELECT DATE_TRUNC(b.unit, u.registered_at) AS slot, u.source, COUNT(*)::int AS count
      FROM audience u CROSS JOIN bounds b GROUP BY 1, 2
    )
    SELECT s.slot AS date,
      COALESCE(jsonb_object_agg(c.source, c.count) FILTER (WHERE c.source IS NOT NULL), '{}'::jsonb) AS sources
    FROM series s LEFT JOIN counts c ON c.slot = s.slot GROUP BY s.slot ORDER BY s.slot
  `, [projectId, tokenId]);
  return result.rows.map(row => ({
    date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
    sources: row.sources ?? {},
  }));
}
