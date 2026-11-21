/** @fileoverview Долговременный журнал переноса Telegram-аккаунтов в PostgreSQL. */
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type {
  TelegramAccountCutoverJournal,
  TelegramAccountCutoverPhase,
  TelegramAccountCutoverPlan,
} from '../bots/telegram-account-cutover-types';

/** Пространство проектных advisory-блокировок операций переноса. */
export const telegramCutoverLockNamespace = 0x544741;

/** Идентификаторы и фаза сохранённого плана. */
interface JournalRow {
  /** Проект операции. */
  project_id: number;
  /** Целевой аккаунт. */
  account_id: number;
  /** Отсортированные идентификаторы ботов. */
  bot_ids: number[];
  /** Последняя подтверждённая фаза. */
  phase: TelegramAccountCutoverPhase;
}

/**
 * Проверяет проект и фиксирует план при первом запуске.
 * @param client - Соединение с проектной блокировкой.
 * @param plan - Нормализованная операция.
 * @param mode - Запуск или откат.
 * @param fence - Маркер актуального владельца операции.
 * @returns Зафиксированная фаза.
 */
async function claim(
  client: PoolClient, plan: TelegramAccountCutoverPlan, mode: 'cutover' | 'rollback', fence: string,
): Promise<TelegramAccountCutoverPhase> {
  await client.query('BEGIN');
  try {
    const project = await client.query('SELECT id FROM bot_projects WHERE id = $1 FOR UPDATE', [plan.projectId]);
    if (project.rowCount !== 1) throw new Error('Проект переноса не найден');
    const { rows: [existing] } = await client.query<JournalRow>(`
      SELECT project_id, account_id, bot_ids, phase
      FROM project_telegram_account_cutovers WHERE id = $1
    `, [plan.id]);
    if (existing && (existing.project_id !== plan.projectId || existing.account_id !== plan.accountId
      || JSON.stringify(existing.bot_ids) !== JSON.stringify(plan.botIds))) {
      throw new Error('Сохранённый план переноса не совпадает с запросом');
    }
    if (!existing) {
      if (mode === 'rollback') throw new Error('Запись переноса для отката не найдена');
      const account = await client.query(
        'SELECT id FROM project_telegram_accounts WHERE id = $1 AND project_id = $2',
        [plan.accountId, plan.projectId],
      );
      const bots = await client.query(
        'SELECT id FROM bot_tokens WHERE id = ANY($1::int[]) AND project_id = $2',
        [plan.botIds, plan.projectId],
      );
      if (account.rowCount !== 1 || bots.rowCount !== plan.botIds.length) {
        throw new Error('Аккаунт или боты переноса не принадлежат этому проекту');
      }
      await client.query(`
        INSERT INTO project_telegram_account_cutovers (id, project_id, account_id, bot_ids, phase)
        VALUES ($1, $2, $3, $4::jsonb, 'prepared')
      `, [plan.id, plan.projectId, plan.accountId, JSON.stringify(plan.botIds)]);
    }
    const busy = await client.query(`
      SELECT id FROM project_telegram_account_cutovers
      WHERE project_id = $1 AND id <> $2 AND phase NOT IN ('shared-ready', 'rolled-back')
    `, [plan.projectId, plan.id]);
    if (busy.rowCount) throw new Error('В проекте незавершён другой перенос аккаунта');
    await client.query(`
      UPDATE project_telegram_account_cutovers
      SET execution_fence = $2, execution_backend_pid = pg_backend_pid(), updated_at = now()
      WHERE id = $1
    `, [plan.id, fence]);
    await client.query('COMMIT');
    return existing?.phase ?? 'prepared';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Создаёт журнал с выделенным соединением на время операции и отдельным сохранением каждой фазы.
 * @param pool - Пул PostgreSQL.
 * @returns Журнал переноса.
 */
export function createTelegramAccountCutoverJournal(pool: Pool): TelegramAccountCutoverJournal {
  return {
    async exclusive(plan, mode, work) {
      const client = await pool.connect();
      const lockKey = [telegramCutoverLockNamespace, plan.projectId];
      const fence = randomUUID();
      let acquired = false;
      let releaseError: Error | undefined;
      try {
        const lockQuery = await client.query<{ acquired: boolean }>(
          'SELECT pg_try_advisory_lock($1, $2) AS acquired', lockKey,
        ).catch(error => {
          releaseError = new Error('Соединение не подтвердило запрос блокировки');
          throw error;
        });
        acquired = lockQuery.rows[0]?.acquired === true;
        if (!acquired) throw new Error('Перенос аккаунта для проекта уже выполняется');
        let phase = await claim(client, plan, mode, fence);
        return await work({
          get phase() { return phase; },
          fence,
          async advance(next) {
            const result = await client.query(`
              UPDATE project_telegram_account_cutovers SET phase = $1, updated_at = now(),
                runtime_state = CASE WHEN $1 = 'rollback-started' AND phase = 'shared-ready'
                  THEN jsonb_set(COALESCE(runtime_state, '{}'::jsonb), '{sharedStartAttempted}', 'true'::jsonb)
                  ELSE runtime_state END
              WHERE id = $2 AND execution_fence = $3 AND phase = $4
            `, [next, plan.id, fence, phase]);
            if (result.rowCount !== 1) throw new Error('Захват журнала переноса потерян');
            phase = next;
          },
        });
      } finally {
        try {
          if (acquired) {
            await client.query(`
              UPDATE project_telegram_account_cutovers SET execution_fence = NULL, execution_backend_pid = NULL
              WHERE id = $1 AND execution_fence = $2
            `, [plan.id, fence]);
            const unlocked = await client.query<{ released: boolean }>(
              'SELECT pg_advisory_unlock($1, $2) AS released', lockKey,
            );
            if (unlocked.rows[0]?.released !== true) throw new Error('Соединение не подтвердило освобождение журнала');
          }
        } catch {
          releaseError = new Error('Соединение журнала переноса повреждено');
        } finally {
          client.release(releaseError);
        }
      }
    },
  };
}
