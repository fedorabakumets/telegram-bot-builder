/**
 * @fileoverview MCP-обёртка массовой проверки доступов через HTTP API приложения.
 * @module lib/bot-tools/chat-access-check-db
 */
import { apiFetch } from './api-fetch.ts';

/** Допустимые статусы задачи проверки. */
const STATUSES = ['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed'] as const;

/** Сообщения API, которые можно отдать агенту. */
const SAFE_MESSAGES = new Set([
  'Проверка уже выполняется',
  'Бот не найден в проекте',
  'Некорректные параметры проверки',
]);

/** Параметры запуска или опроса проверки одного бота. */
export interface ChatAccessCheckOptions {
  /** Идентификатор токена бота. */
  token_id: number;
}

/** Безопасная карточка задачи в snake_case. */
export interface ChatAccessCheckSnakeJob {
  /** Идентификатор задачи. */
  job_id: number;
  /** Проект. */
  project_id: number;
  /** Токен бота. */
  token_id: number;
  /** Состояние очереди. */
  status: (typeof STATUSES)[number];
  /** Всего людей в проверке: с личным сообщением или без сообщений вовсе. */
  total_count: number;
  /** Уже проверено. */
  processed_count: number;
  /** Доступны. */
  available_count: number;
  /** Заблокировали бота. */
  kicked_count: number;
  /** Аккаунт удалён. */
  deleted_count: number;
  /** Ошибки отдельных запросов. */
  error_count: number;
  /** ISO-время старта или null. */
  started_at: string | null;
  /** ISO-время завершения или null. */
  finished_at: string | null;
}

/**
 * Неотрицательное целое или null.
 * @param value - Сырое число из JSON
 * @returns Усечённое значение или null
 */
function count(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

/**
 * Оставляет ISO-строку или null.
 * @param value - Поле даты из API
 * @returns Строка, null или undefined, если формат чужой
 */
function isoOrNull(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === 'string' && value.length > 0 && value.length < 80) return value;
  return undefined;
}

/**
 * Переводит карточку API в whitelist snake_case.
 * @param raw - Поле job из ответа
 * @param projectId - Проект запроса
 * @param tokenId - Токен запроса
 * @returns Карточка или null
 */
export function toSnakeJob(raw: unknown, projectId: number, tokenId: number): ChatAccessCheckSnakeJob | null {
  if (!raw || typeof raw !== 'object') return null;
  const job = raw as Record<string, unknown>;
  const status = job.status;
  if (typeof status !== 'string' || !STATUSES.includes(status as ChatAccessCheckSnakeJob['status'])) return null;
  const numbers = [
    count(job.jobId), count(job.totalCount), count(job.processedCount),
    count(job.availableCount), count(job.kickedCount), count(job.deletedCount), count(job.errorCount),
  ];
  if (numbers.some((value) => value == null) || (numbers[0] ?? 0) < 1) return null;
  const startedAt = isoOrNull(job.startedAt);
  const finishedAt = isoOrNull(job.finishedAt);
  if (startedAt === undefined || finishedAt === undefined) return null;
  const [jobId, total, processed, available, kicked, deleted, errors] = numbers as number[];
  return {
    job_id: jobId, project_id: count(job.projectId) ?? projectId, token_id: count(job.tokenId) ?? tokenId,
    status: status as ChatAccessCheckSnakeJob['status'],
    total_count: total, processed_count: processed, available_count: available,
    kicked_count: kicked, deleted_count: deleted, error_count: errors,
    started_at: startedAt, finished_at: finishedAt,
  };
}

/**
 * Безопасная ошибка по статусу HTTP.
 * @param status - Код ответа
 * @param body - JSON тела
 * @param fallback - Подпись действия
 * @returns Объект ошибки для агента
 */
function errorFromResponse(status: number, body: unknown, fallback: string): { error: string } {
  if (status === 409) return { error: 'Проверка уже выполняется' };
  const message = body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
    ? (body as { message: string }).message
    : '';
  if (SAFE_MESSAGES.has(message)) return { error: message };
  return { error: `${fallback}: HTTP ${status}` };
}

/**
 * Читает JSON или пустой объект.
 * @param response - Ответ fetch
 * @returns Разобранное тело
 */
async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

/**
 * Запускает массовую проверку людей, которые писали лично или ещё не писали.
 * @param projectId - Идентификатор проекта
 * @param options - Токен бота
 * @returns Карточка задачи или безопасная ошибка
 */
export async function startChatAccessCheckInDb(projectId: number, options: ChatAccessCheckOptions) {
  try {
    const response = await apiFetch(`/api/projects/${projectId}/chat-access-checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: options.token_id }),
    });
    const body = await readJson(response);
    if (!response.ok) return errorFromResponse(response.status, body, 'Не удалось запустить проверку доступов');
    const job = toSnakeJob((body as { job?: unknown })?.job, projectId, options.token_id);
    if (!job) return { error: 'Не удалось запустить проверку доступов' };
    return { ok: true as const, project_id: projectId, token_id: options.token_id, job };
  } catch {
    return { error: 'Не удалось запустить проверку доступов' };
  }
}

/**
 * Возвращает активную или последнюю проверку выбранного бота.
 * @param projectId - Идентификатор проекта
 * @param options - Токен бота
 * @returns Карточка, null или безопасная ошибка
 */
export async function getChatAccessCheckInDb(projectId: number, options: ChatAccessCheckOptions) {
  try {
    const params = new URLSearchParams({ tokenId: String(options.token_id) });
    const response = await apiFetch(`/api/projects/${projectId}/chat-access-checks/active?${params}`);
    const body = await readJson(response);
    if (!response.ok) return errorFromResponse(response.status, body, 'Не удалось получить статус проверки');
    const raw = (body as { job?: unknown })?.job;
    if (raw == null) return { ok: true as const, project_id: projectId, token_id: options.token_id, job: null };
    const job = toSnakeJob(raw, projectId, options.token_id);
    if (!job) return { error: 'Не удалось получить статус проверки' };
    return { ok: true as const, project_id: projectId, token_id: options.token_id, job };
  } catch {
    return { error: 'Не удалось получить статус проверки' };
  }
}
