/** @fileoverview Преобразование агрегатов истории в явный публичный контракт без полей таблиц. */
import type { CheckHistoryEntry } from '@shared/check-history';
/** Строка агрегатов, читаемая только через фиксированный SQL. */
export type HistoryRow = Record<string, unknown>;
/** Приводит время PostgreSQL к ISO UTC. @param value - Дата драйвера или строка. @returns Время либо null. */
export function historyTime(value: unknown): string | null {
  return value instanceof Date ? value.toISOString() : typeof value === 'string' ? new Date(value).toISOString() : null;
}
/** Отбрасывает произвольный текст причин в старых строках. @param value - Код причины. @returns Разрешённый код либо null. */
export function historyFailure(value: unknown): string | null {
  return typeof value === 'string' && ['server_interrupted', 'unauthorized', 'bot_removed', 'internal_error',
    'partial_failure', 'worker_failed', 'worker_interrupted', 'token_changed', 'cancelled', 'cancelled_by_user',
    'user_cancelled', 'bot_unavailable', 'telegram_unauthorized', 'queue_error', 'worker_error'].includes(value) ? value : null;
}
/** Приводит агрегаты PostgreSQL к числовым счётчикам. @param value - Число или bigint-строка. @returns Неотрицательное число. */
function count(value: unknown): number { const number = Number(value); return Number.isFinite(number) ? Math.max(0, number) : 0; }
/** Собирает только разрешённые свойства карточки запуска. @param row - Агрегаты SQL. @returns Публичная карточка. */
export function mapHistoryEntry(row: HistoryRow): CheckHistoryEntry {
  const tokenId = row.scope_token_id == null ? null : count(row.scope_token_id);
  const base = {
    id: String(row.run_id), projectId: count(row.project_id),
    status: row.status as CheckHistoryEntry['status'], createdAt: historyTime(row.created_at)!,
    startedAt: historyTime(row.started_at), finishedAt: historyTime(row.finished_at),
    failureReason: historyFailure(row.failure_reason),
    scope: { mode: tokenId === null ? 'all_bots' as const : 'selected_bot' as const, tokenId,
      username: typeof row.scope_username === 'string' ? row.scope_username : null,
      name: typeof row.scope_name === 'string' ? row.scope_name : undefined,
      projectName: typeof row.project_name === 'string' ? row.project_name : undefined },
  };
  if (row.kind === 'telegram-bots') return { ...base, kind: 'telegram-bots', summary: {
    unit: 'bots', total: count(row.total_count), processed: count(row.processed_count), available: count(row.available_count),
    frozen: count(row.frozen_count), invalidToken: count(row.invalid_count), otherUnavailable: count(row.other_count), errors: count(row.error_count),
  } };
  return { ...base, kind: 'private-chats', summary: {
    unit: 'bot_chats', botsTotal: count(row.bots_total), botsFinished: count(row.bots_finished),
    total: count(row.total_count), processed: count(row.processed_count), available: count(row.available_count),
    blocked: count(row.kicked_count), deleted: count(row.deleted_count), errors: count(row.error_count),
  } };
}
