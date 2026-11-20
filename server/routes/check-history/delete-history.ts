/** @fileoverview Удаление только завершённой истории проверок без изменения контактов и текущих статусов. */
import type { Pool } from 'pg';
import { pool } from '../../database/db';
import type { CheckHistoryKind } from '@shared/check-history';
/** Удаляет завершённые запуски выбранной области одной транзакцией. @param projectId - Разрешённый проект. @param kind - Вид проверок. @param tokenId - Участник либо все боты. @param database - Изолируемый пул. @returns Количество удалённых запусков. */
export async function deleteCheckHistory(projectId: number, kind: CheckHistoryKind, tokenId: number | null, database: Pool = pool): Promise<number> {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    let deleted = 0;
    if (kind === 'telegram-bots') {
      const result = await client.query(`DELETE FROM telegram_bot_check_runs r WHERE r.project_id=$1
        AND r.status IN ('completed','cancelled','failed') AND ($2::integer IS NULL OR EXISTS(
          SELECT 1 FROM telegram_bot_check_items i WHERE i.project_id=$1 AND i.run_id=r.id AND i.token_id=$2)) RETURNING r.id`, [projectId, tokenId]);
      deleted = result.rowCount ?? 0;
    } else {
      /** Группа удаляется целиком лишь после завершения всех дочерних очередей. */
      const batches = await client.query(`DELETE FROM chat_access_check_batches b WHERE b.project_id=$1
        AND b.status IN ('completed','cancelled','failed')
        AND NOT EXISTS(SELECT 1 FROM chat_access_check_jobs j WHERE j.project_id=$1 AND j.id=ANY(b.job_ids)
          AND j.status IN ('pending','running','cancelling'))
        AND ($2::integer IS NULL OR EXISTS(SELECT 1 FROM chat_access_check_jobs j WHERE j.project_id=$1
          AND j.id=ANY(b.job_ids) AND j.token_id=$2)) RETURNING b.job_ids`, [projectId, tokenId]);
      const children = batches.rows.flatMap(row => row.job_ids as number[]);
      if (children.length) await client.query(`DELETE FROM chat_access_check_jobs j WHERE j.project_id=$1
        AND j.id=ANY($2::integer[]) AND j.status IN ('completed','cancelled','failed')
        AND NOT EXISTS(SELECT 1 FROM chat_access_check_batches b WHERE b.project_id=$1 AND j.id=ANY(b.job_ids))`, [projectId, children]);
      const jobs = await client.query(`DELETE FROM chat_access_check_jobs j WHERE j.project_id=$1
        AND j.status IN ('completed','cancelled','failed') AND ($2::integer IS NULL OR j.token_id=$2)
        AND NOT EXISTS(SELECT 1 FROM chat_access_check_batches b WHERE b.project_id=$1 AND j.id=ANY(b.job_ids)) RETURNING j.id`, [projectId, tokenId]);
      deleted = (batches.rowCount ?? 0) + (jobs.rowCount ?? 0);
    }
    await client.query('COMMIT'); return deleted;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
