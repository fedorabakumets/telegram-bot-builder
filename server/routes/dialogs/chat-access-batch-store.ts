/** @fileoverview Атомарное создание и хранение групп проверок всех ботов проекта. */
import type { Pool } from 'pg';
import { pool } from '../../database/db';
import type { ChatAccessBatch } from '@shared/chat-access-batch';
import type { ChatAccessCheckStatus } from '@shared/project-sync/project-event';
import { mapChatAccessCheckJob } from './chat-access-check-job-store';
/** План бота без секретного токена. */
export interface BatchPlan {
  /** Идентификатор бота. */ tokenId: number;
  /** Число личных чатов. */ total: number;
}
/** Создаёт изолируемый репозиторий; тесты передают отдельный пул. @param database - Пул разрешённой базы. @returns Методы группы. */
export function createChatAccessBatchStore(database: Pool = pool) {
  let ready: Promise<unknown> | undefined;
  /** Создаёт только новую таблицу и защиту от одновременного запуска проекта. */
  function ensure() {
    return ready ??= database.query(`CREATE TABLE IF NOT EXISTS chat_access_check_batches(
      id SERIAL PRIMARY KEY,project_id INTEGER NOT NULL,job_ids INTEGER[] NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,finished_at TIMESTAMPTZ,failure_reason TEXT,worker_id TEXT,lease_until TIMESTAMPTZ,project_name TEXT);
      CREATE UNIQUE INDEX IF NOT EXISTS chat_access_batch_one_active ON chat_access_check_batches(project_id)
      WHERE status IN ('pending','running','cancelling')`).catch(error => { ready = undefined; throw error; });
  }
  /** Читает только группу и задачи текущего проекта. */
  async function get(projectId: number, id?: number): Promise<ChatAccessBatch | null> {
    await ensure();
    const result = await database.query(`SELECT id,project_id,job_ids,
      CASE WHEN status IN ('pending','running','cancelling') AND COALESCE(lease_until,created_at+interval '2 minutes')<now()
        THEN 'failed' ELSE status END AS status FROM chat_access_check_batches
      WHERE project_id=$1 AND ($2::integer IS NULL OR id=$2) ORDER BY id DESC LIMIT 1`, [projectId, id ?? null]);
    const row = result.rows[0];
    if (!row) return null;
    const jobs = await database.query(`SELECT id AS "jobId",project_id AS "projectId",token_id AS "tokenId",
      CASE WHEN status IN ('pending','running','cancelling') AND COALESCE(lease_until,created_at+interval '2 minutes')<now()
        THEN 'failed' ELSE status END AS status,
      total_count AS "totalCount",processed_count AS "processedCount",available_count AS "availableCount",
      kicked_count AS "kickedCount",deleted_count AS "deletedCount",error_count AS "errorCount",
      started_at AS "startedAt",finished_at AS "finishedAt" FROM chat_access_check_jobs
      WHERE project_id=$1 AND id=ANY($2::integer[]) ORDER BY id`, [projectId, row.job_ids]);
    return { id: row.id, projectId, status: row.status, jobs: jobs.rows.map(mapChatAccessCheckJob) };
  }
  /** Резервирует все задачи одной транзакцией; существующая проверка исключает частичный запуск. */
  async function create(projectId: number, plans: BatchPlan[]): Promise<ChatAccessBatch | null> {
    await ensure();
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1,-731)', [projectId]);
      await client.query(`UPDATE chat_access_check_jobs SET status='failed',finished_at=now(),failure_reason='worker_interrupted'
        WHERE project_id=$1 AND status IN ('pending','running','cancelling')
        AND COALESCE(lease_until,created_at+interval '2 minutes')<now()`, [projectId]);
      const active = await client.query(`SELECT id FROM chat_access_check_jobs WHERE project_id=$1
        AND token_id=ANY($2::integer[]) AND status IN ('pending','running','cancelling')`, [projectId, plans.map(plan => plan.tokenId)]);
      if (active.rowCount) { await client.query('ROLLBACK'); return null; }
      const ids: number[] = [];
      for (const plan of plans) {
        const result = await client.query(`INSERT INTO chat_access_check_jobs(project_id,token_id,historical_token_id,token_name,token_username,project_name,status,total_count)
          SELECT $1,id,id,COALESCE(bot_first_name,name),bot_username,(SELECT name FROM bot_projects WHERE id=$1),'pending',$3 FROM bot_tokens
          WHERE project_id=$1 AND id=$2 RETURNING id`, [projectId, plan.tokenId, plan.total]);
        if (!result.rows[0]) throw new Error('Бот проекта не найден');
        ids.push(result.rows[0].id);
      }
      const batch = await client.query(`INSERT INTO chat_access_check_batches(project_id,job_ids,project_name)
        VALUES($1,$2::integer[],(SELECT name FROM bot_projects WHERE id=$1)) RETURNING id`, [projectId, ids]);
      await client.query('COMMIT');
      return get(projectId, batch.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { /** Код PostgreSQL. */ code?: string }).code === '23505') return null;
      throw error;
    } finally { client.release(); }
  }
  /** Меняет состояние только внутри авторизованного проекта. */
  async function setStatus(projectId: number, id: number, status: ChatAccessCheckStatus, failureReason?: string) {
    await ensure();
    await database.query(`UPDATE chat_access_check_batches SET status=$3,failure_reason=$4,
      finished_at=CASE WHEN $3 IN ('completed','cancelled','failed') THEN now() ELSE finished_at END
      WHERE project_id=$1 AND id=$2`, [projectId, id, status, failureReason ?? null]);
  }
  /** Резервирует исполнение группы в конкретном процессе с ограниченным сроком владения. */
  async function claim(projectId: number, id: number, workerId: string): Promise<boolean> {
    await ensure();
    const result = await database.query(`UPDATE chat_access_check_batches SET worker_id=$3,
      lease_until=now()+interval '60 seconds',started_at=COALESCE(started_at,now())
      WHERE project_id=$1 AND id=$2 AND status='running' AND worker_id IS NULL RETURNING id`, [projectId,id,workerId]);
    return !!result.rowCount;
  }
  /** Продлевает только собственную активную задачу; другой процесс не может присвоить её. */
  async function heartbeat(projectId: number, id: number, workerId: string): Promise<boolean> {
    const result = await database.query(`UPDATE chat_access_check_batches SET lease_until=now()+interval '60 seconds'
      WHERE project_id=$1 AND id=$2 AND worker_id=$3 AND status IN ('running','cancelling') RETURNING id`, [projectId,id,workerId]);
    return !!result.rowCount;
  }
  /** Прерывает только истёкшие группы перед новым запуском, сохраняя накопленные счётчики. */
  async function failExpired(projectId: number) {
    await ensure();
    await database.query(`WITH expired AS (UPDATE chat_access_check_batches SET status='failed',
      failure_reason='worker_interrupted',finished_at=now()
      WHERE project_id=$1 AND status IN ('pending','running','cancelling')
      AND COALESCE(lease_until,created_at+interval '2 minutes')<now() RETURNING job_ids)
      UPDATE chat_access_check_jobs SET status='failed',finished_at=now(),failure_reason='worker_interrupted'
      WHERE project_id=$1 AND status IN ('pending','running','cancelling')
      AND id IN (SELECT unnest(job_ids) FROM expired)`, [projectId]);
  }
  return { get, create, setStatus, claim, heartbeat, failExpired };
}
/** Общий репозиторий процесса без хранения секретов. */
export const chatAccessBatchStore = createChatAccessBatchStore();
