/** @fileoverview Проверка журнала переноса перед запуском Telegram-бота. */
import { Pool } from 'pg';
import { pool } from './db';
import { telegramCutoverLockNamespace } from './project-telegram-account-cutover-journal';

/** Пять разделяемых разрешений соответствуют общему лимиту запусков и не занимают основной пул. */
const launchPermits = new Pool({ ...pool.options, max: 5, application_name: 'telegram-cutover-launch-permits' });

/** Разрешение запуска от исполнителя переноса. */
export interface TelegramAccountCutoverAuthorization {
  /** Идентификатор операции переноса. */
  id: string;
  /** Маркер актуального захвата в журнале. */
  fence: string;
}

/**
 * Проверяет блокировку обычных запусков до завершения или отката переноса.
 * @param projectId - Проект бота.
 * @param tokenId - Идентификатор бота.
 * @param authorization - Необязательное разрешение контролируемого запуска.
 * @returns Блокируется ли запуск.
 */
export async function isTelegramAccountCutoverStartBlocked(
  projectId: number, tokenId: number, authorization?: TelegramAccountCutoverAuthorization,
): Promise<boolean> {
  /** До первой установки схема переноса может отсутствовать у локального раннера. */
  const schema = await pool.query<{ present: boolean }>(
    "SELECT to_regclass('project_telegram_account_cutovers') IS NOT NULL AS present",
  );
  if (schema.rows[0]?.present === false) return false;
  const { rows: [result] } = await pool.query<{ blocked: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM project_telegram_account_cutovers c
      WHERE c.project_id = $1 AND c.phase NOT IN ('shared-ready', 'rolled-back')
        AND c.bot_ids @> jsonb_build_array($2::int)
        AND NOT COALESCE((
          c.id = $3 AND c.execution_fence = $4 AND c.phase IN ('shared-installed', 'legacy-restored')
          AND EXISTS (
            SELECT 1 FROM pg_locks l WHERE l.pid = c.execution_backend_pid
              AND l.locktype = 'advisory' AND l.granted AND l.objsubid = 2
              AND l.classid = $5::oid AND l.objid = c.project_id::oid
              AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
          )
        ), FALSE)
    ) AS blocked
  `, [projectId, tokenId, authorization?.id ?? null, authorization?.fence ?? null, telegramCutoverLockNamespace]);
  return result?.blocked !== false;
}

/**
 * Захватывает разделяемую блокировку проекта до завершения отправки команды запуска.
 * @param projectId - Проект обычного запуска.
 * @returns Освобождение захвата или null, если выполняется перенос.
 */
export async function acquireTelegramAccountNormalStartPermit(projectId: number): Promise<(() => Promise<void>) | null> {
  const client = await launchPermits.connect();
  const key = [telegramCutoverLockNamespace, projectId];
  try {
    const result = await client.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock_shared($1, $2) AS acquired', key,
    );
    if (result.rows[0]?.acquired !== true) {
      client.release();
      return null;
    }
    return async () => {
      try {
        const unlocked = await client.query<{ released: boolean }>(
          'SELECT pg_advisory_unlock_shared($1, $2) AS released', key,
        );
        client.release(unlocked.rows[0]?.released !== true);
      } catch {
        client.release(true);
      }
    };
  } catch (error) {
    client.release(true);
    throw error;
  }
}
