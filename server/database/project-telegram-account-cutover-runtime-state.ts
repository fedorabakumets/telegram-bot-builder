/** @fileoverview Хранение исходных активных запусков в журнале переноса Telegram. */
import type { TelegramAccountCutoverExecution, TelegramAccountCutoverPhase } from '../bots/telegram-account-cutover-types';
import { pool } from './db';
import { telegramCutoverLockNamespace } from './project-telegram-account-cutover-journal';

/** Технические метки переноса без параметров авторизации Telegram. */
export interface TelegramCutoverRuntimeState {
  /** Боты, работавшие до остановки. */
  legacyIntent?: number[];
  /** Выход старого процесса подтверждён ОС. */
  legacyWorkerExited?: true;
  /** После перевода хотя бы один запуск нового воркера мог быть отправлен. */
  sharedStartAttempted?: true;
  /** Наличие этой метки означает, что общее подключение могло быть запущено. */
  bindingInstall?: object;
}

/** Имя и значение одного подтверждаемого факта среды запуска. */
type RuntimeObservation =
  | { /** Исходные запуски. */ key: 'legacyIntent'; /** Боты из исходного снимка. */ value: readonly number[] }
  | { /** Подтверждение выхода или начало контролируемых перезапусков. */ key: 'legacyWorkerExited' | 'sharedStartAttempted';
      /** Метка выставляется однократно. */ value: true };

/**
 * Читает метки переноса и при первом вызове фиксирует исходные активные запуски.
 * @param execution - План и активный маркер захвата.
 * @param phase - Фаза, разрешающая действие среды запуска.
 * @param observation - Факт для долговременного сохранения.
 * @returns Сохранённые технические метки.
 */
export async function loadTelegramCutoverRuntimeState(
  { plan, fence }: TelegramAccountCutoverExecution, phase: TelegramAccountCutoverPhase, observation?: RuntimeObservation,
): Promise<TelegramCutoverRuntimeState> {
  /** Пока соединение журнала держит блокировку, разрешены только действия актуального владельца. */
  const conditions = `
    c.id = $1 AND c.project_id = $2 AND c.execution_fence = $3 AND c.phase = $4
    AND EXISTS (
      SELECT 1 FROM pg_locks l WHERE l.pid = c.execution_backend_pid
        AND l.locktype = 'advisory' AND l.granted AND l.objsubid = 2
        AND l.classid = $5::oid AND l.objid = c.project_id::oid
        AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
    )
  `;
  const args = [plan.id, plan.projectId, fence, phase, telegramCutoverLockNamespace];
  const sql = observation === undefined
    ? `SELECT c.runtime_state FROM project_telegram_account_cutovers c WHERE ${conditions}`
    : `UPDATE project_telegram_account_cutovers c
      SET runtime_state = jsonb_set(
        COALESCE(c.runtime_state, '{}'::jsonb), ARRAY[$6::text],
        COALESCE(c.runtime_state -> $6::text, $7::jsonb)
      )
      WHERE ${conditions} RETURNING c.runtime_state`;
  const { rows: [row] } = await pool.query<{ /** Технические метки. */ runtime_state: TelegramCutoverRuntimeState | null }>(
    sql, observation === undefined ? args : [...args, observation.key, JSON.stringify(observation.value)],
  );
  if (!row) throw new Error('Захват переноса утрачен');
  return row.runtime_state ?? {};
}
