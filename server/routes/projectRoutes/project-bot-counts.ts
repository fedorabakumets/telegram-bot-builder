/** @fileoverview Подсчёт ботов только в проектах, уже разрешённых текущему пользователю. */
import { pool } from '../../database/db';
/**
 * Получает количества одним запросом без чтения или выдачи секретных токенов.
 * @param projectIds - Идентификаторы доступных проектов из проверенного списка.
 * @returns Карта количества ботов по проектам.
 */
export async function getProjectBotCounts(projectIds: number[]): Promise<Map<number, number>> {
  if (!projectIds.length) return new Map();
  const { rows } = await pool.query(`SELECT project_id,COUNT(*)::integer AS count FROM bot_tokens
    WHERE project_id=ANY($1::integer[]) GROUP BY project_id`, [projectIds]);
  return new Map(rows.map(row => [Number(row.project_id), Number(row.count)]));
}
