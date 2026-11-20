/** @fileoverview Чтение безопасных снимков истории без выполнения Telegram-запросов. */
import type { Pool, PoolClient } from 'pg';
import type { TelegramBotCheckItem } from '@shared/telegram-bot-check';
import type { BotHistoryRun } from './telegram-bot-history-types';
/** Читает одну проверку исключительно внутри проекта. @param database - Пул либо транзакция. @param projectId - Проект. @param id - Запуск. @returns Снимок или отсутствие записи. */
export async function readBotHistoryRun(database: Pool | PoolClient, projectId: number, id: number): Promise<BotHistoryRun | null> {
  const run = (await database.query(`SELECT r.*,COALESCE((SELECT json_agg(i ORDER BY i.token_id) FROM (
    SELECT token_id,name,username,status,reason,method,error_code,started_at,finished_at FROM telegram_bot_check_items
    WHERE project_id=$1 AND run_id=$2 AND status IN ('available','unavailable','error') AND finished_at IS NOT NULL
    ) i),'[]'::json) AS items FROM telegram_bot_check_runs r WHERE r.project_id=$1 AND r.id=$2`, [projectId, id])).rows[0];
  if (!run) return null;
  const rows: Record<string, any>[] = run.items;
  /** Нормализует даты PostgreSQL к ISO без изменения часового пояса. */
  const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value ? String(value) : null;
  const items: TelegramBotCheckItem[] = rows.map(row => ({ tokenId: row.token_id, name: row.name ?? undefined,
    username: row.username, status: row.status, reason: row.reason ?? undefined, method: row.method ?? undefined,
    errorCode: row.error_code ?? undefined, startedAt: iso(row.started_at) ?? undefined, finishedAt: iso(row.finished_at) ?? undefined }));
  return { id: run.id, projectId, projectName: run.project_name, scopeTokenId: run.scope_token_id, scopeName: run.scope_name,
    status: run.status, createdAt: iso(run.created_at)!, startedAt: iso(run.started_at)!, updatedAt: iso(run.updated_at)!,
    finishedAt: iso(run.finished_at), failureReason: run.failure_reason, total: run.total_count,
    result: { items, available: run.available_count, unavailable: run.unavailable_count, errors: run.error_count } };
}
