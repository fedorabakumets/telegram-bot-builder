/** @fileoverview Владение очередью личных чатов с безопасным истечением аренды процесса. */
import { randomUUID } from 'node:crypto';
import { pool } from '../../database/db';
/** Резервирует задачу и поддерживает аренду, не возобновляя запросы после рестарта. @param jobId - Задача очереди. @param lost - Остановка при потере владения. @returns Освобождение таймера либо отказ резервирования. */
export async function startChatAccessJobLease(jobId: number, lost: () => void): Promise<(() => void) | null> {
  const workerId = randomUUID();
  const claimed = await pool.query(`UPDATE chat_access_check_jobs SET worker_id=$2,lease_until=now()+interval '60 seconds',
    started_at=COALESCE(started_at,now()) WHERE id=$1 AND status IN ('pending','running') AND worker_id IS NULL RETURNING id`, [jobId,workerId]);
  if (!claimed.rowCount) return null;
  /** Ошибка БД прекращает дальнейшие действия вместо неограниченного исполнения без аренды. */
  const timer = setInterval(() => {
    void pool.query(`UPDATE chat_access_check_jobs SET lease_until=now()+interval '60 seconds'
      WHERE id=$1 AND worker_id=$2 AND status='running' RETURNING id`, [jobId,workerId])
      .then(result => { if (!result.rowCount) lost(); }).catch(lost);
  },15_000);
  timer.unref();
  return () => clearInterval(timer);
}
