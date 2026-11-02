/** @fileoverview Явный возобновляемый перенос аналитики одного проекта и бота с контрольными точками. */
import 'dotenv/config';
import { Pool } from 'pg';
import { backfillAnalyticsBatch } from '../server/database/analytics-v2/backfill';
/**
 * Переносит сохранённую историю только явно указанных проекта и бота.
 * @returns Завершение переноса либо безопасная ошибка без строки подключения.
 */
async function main(): Promise<void> {
  const [project, token] = process.argv.slice(2).map(Number);
  if (!Number.isSafeInteger(project) || project <= 0 || !Number.isSafeInteger(token) || token <= 0) throw new Error('Укажите projectId и tokenId: npx tsx scripts/backfill-analytics-v2.ts 12 34');
  if (!process.env.DATABASE_URL) throw new Error('Не задано подключение DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  try {
    let complete = false;
    while (!complete) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const progress = await backfillAnalyticsBatch(client, project, token);
        await client.query('COMMIT');
        console.log(JSON.stringify({ project_id: project, token_id: token, ...progress }));
        complete = progress.complete;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    }
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Перенос не выполнен'); process.exitCode = 1; });
