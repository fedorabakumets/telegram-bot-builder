/** @fileoverview Явный аудированный перенос исторических свидетельств: предпросмотр по умолчанию, запись только с --apply. */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { Pool } from 'pg';
import { validateEvidencePolicy } from '../server/database/analytics-v2/evidence-policy';
import { previewAudienceEvidence } from '../server/database/analytics-v2/evidence-preview';
import { backfillAudienceEvidenceBatch } from '../server/database/analytics-v2/evidence-backfill';
/**
 * Проверяет fingerprint файла и выполняет только явно выбранную операцию.
 * @returns Безопасные агрегаты и контрольная точка без содержимого истории.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { project: { type: 'string' }, token: { type: 'string' },
    'through-message-id': { type: 'string' }, 'historical-username': { type: 'string' }, 'writer-sha256': { type: 'string' },
    artifact: { type: 'string' }, apply: { type: 'boolean', default: false } } });
  const policy = validateEvidencePolicy({ projectId: Number(values.project), tokenId: Number(values.token),
    throughMessageId: Number(values['through-message-id']), historicalUsername: values['historical-username'] || '', writerSha256: values['writer-sha256'] || '' });
  if (!values.artifact || createHash('sha256').update(readFileSync(values.artifact)).digest('hex') !== policy.writerSha256) throw new Error('Файл проверенной сборки не совпадает с SHA256 политики');
  if (!process.env.DATABASE_URL) throw new Error('Не задано подключение DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const preview = await previewAudienceEvidence(client, policy);
    await client.query('COMMIT');
    console.log(JSON.stringify({ mode: values.apply ? 'apply' : 'preview', ...policy, ...preview }));
    if (!values.apply) return;
    let complete = false;
    while (!complete) {
      await client.query('BEGIN');
      const progress = await backfillAudienceEvidenceBatch(client, policy);
      await client.query('COMMIT');
      console.log(JSON.stringify({ project_id: policy.projectId, token_id: policy.tokenId, ...progress }));
      complete = progress.complete;
    }
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); await pool.end(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Исторические свидетельства не перенесены'); process.exitCode = 1; });
