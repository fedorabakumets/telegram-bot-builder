/** @fileoverview Постоянная история проверок: страницы агрегатов и отдельное чтение подробностей. */
import type { CheckHistoryDetail, CheckHistoryPage } from '@shared/check-history';
import { pool } from '../../database/db';
import { mapChatAccessCheckJob } from '../dialogs/chat-access-check-job-store';
import { CHECK_HISTORY_SQL } from './sql';
import { historyFailure, mapHistoryEntry } from './map-entry';
import { mapHistoryItem } from './map-item';
import { historyStateSql } from './state-sql';
import type { CheckHistoryQuery } from './query';
/** Формирует параметры фиксированной выборки. @param projectId - Разрешённый проект. @param query - Проверенные фильтры. @param runId - Детальный ключ. @returns Параметры SQL. */
function parameters(projectId: number, query: CheckHistoryQuery, runId?: string) {
  return [projectId, query.kind ?? null, query.tokenId ?? null, query.beforeAt ?? null, query.beforeId ?? null, runId ?? null, query.limit + 1];
}
/** Читает страницу без списков чатов и без запуска сетевых проверок. @param projectId - Разрешённый проект. @param query - Ограничения страницы. @returns Карточки и курсор. */
export async function listCheckHistory(projectId: number, query: CheckHistoryQuery): Promise<CheckHistoryPage> {
  const result = await pool.query(CHECK_HISTORY_SQL, parameters(projectId, query));
  const items = result.rows.slice(0, query.limit).map(mapHistoryEntry);
  const last = items[items.length - 1];
  return { items, nextCursor: result.rows.length > query.limit && last
    ? Buffer.from(JSON.stringify({ at: last.createdAt, id: last.id })).toString('base64url') : null };
}
/** Читает детали запуска только внутри разрешённого проекта. @param projectId - Проект. @param runId - Проверенный составной ключ. @returns Подробности либо отсутствие записи. */
export async function getCheckHistory(projectId: number, runId: string): Promise<CheckHistoryDetail | null> {
  const row = (await pool.query(CHECK_HISTORY_SQL, parameters(projectId, { limit: 1 }, runId))).rows[0];
  if (!row) return null;
  const run = mapHistoryEntry(row), [kind, rawId] = runId.split(':'), id = Number(rawId);
  if (kind === 'telegram-bots') {
    const bots = (await pool.query(`SELECT token_id,name,username,status,reason,method,error_code,started_at,finished_at FROM telegram_bot_check_items
      WHERE project_id=$1 AND run_id=$2 ORDER BY token_id`, [projectId, id])).rows;
    run.scope.bots = bots.map(bot => ({ tokenId: Number(bot.token_id), name: bot.name ?? 'Бот', username: bot.username ?? null }));
    return { run, details: { items: bots.map(mapHistoryItem) } };
  }
  const state = historyStateSql('j');
  const jobs = (await pool.query(`SELECT j.id AS "jobId",j.project_id AS "projectId",COALESCE(j.token_id,j.historical_token_id) AS "tokenId",${state.status} AS status,
    j.total_count AS "totalCount",j.processed_count AS "processedCount",j.available_count AS "availableCount",
    j.kicked_count AS "kickedCount",j.deleted_count AS "deletedCount",j.error_count AS "errorCount",
    j.started_at AS "startedAt",${state.finished} AS "finishedAt",${state.reason} AS failure_reason,j.token_name,j.token_username
    FROM chat_access_check_jobs j WHERE j.project_id=$1 AND
    ($3::boolean AND j.id=$2 OR NOT $3::boolean AND EXISTS(SELECT 1 FROM chat_access_check_batches b
      WHERE b.project_id=$1 AND b.id=$2 AND j.id=ANY(b.job_ids))) ORDER BY j.id`, [projectId, id, kind === 'chat-job'])).rows;
  run.scope.bots = jobs.map(job => ({ tokenId: Number(job.tokenId), name: job.token_name ?? 'Бот', username: job.token_username ?? null }));
  return { run, details: { jobs: jobs.map(job => ({ ...mapChatAccessCheckJob(job), failureReason: historyFailure(job.failure_reason) })) } };
}
