/**
 * @fileoverview Хранение задач массовой проверки доступа.
 * @module server/routes/dialogs/chat-access-check-job-store
 */
import { pool } from '../../database/db';
import type { ChatAccessCheckJobView, ChatAccessCheckStatus } from '@shared/project-sync/project-event';

const SELECT = `id AS "jobId", project_id AS "projectId", token_id AS "tokenId", status,
  total_count AS "totalCount", processed_count AS "processedCount",
  available_count AS "availableCount", kicked_count AS "kickedCount",
  deleted_count AS "deletedCount", error_count AS "errorCount",
  started_at AS "startedAt", finished_at AS "finishedAt"`;

/** Поля, которые очередь может обновлять. */
export interface ChatAccessCheckJobPatch {
  /** Новый статус. */
  status?: ChatAccessCheckStatus;
  /** Всего в очереди. */
  totalCount?: number;
  /** Проверено. */
  processedCount?: number;
  /** Доступны. */
  availableCount?: number;
  /** Заблокировали. */
  kickedCount?: number;
  /** Удалённые аккаунты. */
  deletedCount?: number;
  /** Ошибки. */
  errorCount?: number;
  /** Время завершения. */
  finishedAt?: Date | null;
}

const COLUMNS: Record<keyof ChatAccessCheckJobPatch, string> = {
  status: 'status', totalCount: 'total_count', processedCount: 'processed_count',
  availableCount: 'available_count', kickedCount: 'kicked_count', deletedCount: 'deleted_count',
  errorCount: 'error_count', finishedAt: 'finished_at',
};

/**
 * Приводит строку БД к публичному виду без лишних полей.
 * @param row - Строка SELECT
 * @returns Карточка задачи
 */
export function mapChatAccessCheckJob(row: Record<string, unknown>): ChatAccessCheckJobView {
  const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : value ? String(value) : null);
  return {
    jobId: Number(row.jobId), projectId: Number(row.projectId), tokenId: Number(row.tokenId),
    status: row.status as ChatAccessCheckJobView['status'],
    totalCount: Number(row.totalCount), processedCount: Number(row.processedCount),
    availableCount: Number(row.availableCount), kickedCount: Number(row.kickedCount),
    deletedCount: Number(row.deletedCount), errorCount: Number(row.errorCount),
    startedAt: iso(row.startedAt), finishedAt: iso(row.finishedAt),
  };
}

/**
 * Создаёт running-задачу. null — уже есть активная (unique index).
 * @param projectId - Проект
 * @param tokenId - Токен
 * @param totalCount - Размер очереди
 * @returns Созданная задача или null
 */
export async function createRunningChatAccessCheckJob(
  projectId: number, tokenId: number, totalCount: number,
): Promise<ChatAccessCheckJobView | null> {
  try {
    const result = await pool.query(
      `INSERT INTO chat_access_check_jobs
        (project_id, token_id, status, total_count, started_at)
       VALUES ($1, $2, 'running', $3, now()) RETURNING ${SELECT}`,
      [projectId, tokenId, totalCount],
    );
    return mapChatAccessCheckJob(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return null;
    throw error;
  }
}

/**
 * Активная задача или последняя завершённая для пары проект+токен.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Задача или null
 */
export async function getRelevantChatAccessCheckJob(projectId: number, tokenId: number) {
  const result = await pool.query(
    `SELECT ${SELECT} FROM chat_access_check_jobs
     WHERE project_id = $1 AND token_id = $2
     ORDER BY CASE WHEN status IN ('pending', 'running', 'cancelling') THEN 0 ELSE 1 END, id DESC
     LIMIT 1`,
    [projectId, tokenId],
  );
  return result.rows[0] ? mapChatAccessCheckJob(result.rows[0]) : null;
}

/**
 * Задача по id внутри проекта.
 * @param projectId - Проект
 * @param jobId - Задача
 * @returns Задача или null
 */
export async function getChatAccessCheckJob(projectId: number, jobId: number) {
  const result = await pool.query(
    `SELECT ${SELECT} FROM chat_access_check_jobs WHERE project_id = $1 AND id = $2`,
    [projectId, jobId],
  );
  return result.rows[0] ? mapChatAccessCheckJob(result.rows[0]) : null;
}

/**
 * Обновляет счётчики и статус известными колонками.
 * @param jobId - Задача
 * @param patch - Разрешённые поля
 * @returns Обновлённая задача или null
 */
export async function updateChatAccessCheckJob(jobId: number, patch: ChatAccessCheckJobPatch) {
  const sets: string[] = [];
  const values: unknown[] = [];
  (Object.keys(COLUMNS) as Array<keyof ChatAccessCheckJobPatch>).forEach((key) => {
    if (patch[key] === undefined) return;
    values.push(patch[key]);
    sets.push(`${COLUMNS[key]} = $${values.length}`);
  });
  if (!sets.length) return getChatAccessCheckJobUnscoped(jobId);
  values.push(jobId);
  const result = await pool.query(
    `UPDATE chat_access_check_jobs SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${SELECT}`,
    values,
  );
  return result.rows[0] ? mapChatAccessCheckJob(result.rows[0]) : null;
}

/**
 * Читает задачу без фильтра проекта — только для очереди.
 * @param jobId - Задача
 * @returns Задача или null
 */
export async function getChatAccessCheckJobUnscoped(jobId: number) {
  const result = await pool.query(`SELECT ${SELECT} FROM chat_access_check_jobs WHERE id = $1`, [jobId]);
  return result.rows[0] ? mapChatAccessCheckJob(result.rows[0]) : null;
}

