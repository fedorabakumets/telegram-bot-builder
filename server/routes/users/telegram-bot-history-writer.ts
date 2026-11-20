/** @fileoverview Последовательная фиксация результатов и итогов под блокировкой запуска. */
import type { Pool, PoolClient } from 'pg';
import type { TelegramBotCheckItem } from '@shared/telegram-bot-check';
import { readBotHistoryRun } from './telegram-bot-history-reader';
/** Только безопасные коды попадают в историю. */
const reasons = new Set(['no_test_chat','chat_unavailable','rate_limited','error','timeout','network','telegram_error','invalid_response','unauthorized','telegram_frozen','bot_deactivated','token_changed']);
/** Пересчитывает итог из сохранённых строк, исключая двойной учёт при повторном результате. @param client - Транзакция. @param id - Запуск. */
async function recount(client: PoolClient, id: number) {
  await client.query(`UPDATE telegram_bot_check_runs SET updated_at=now(),processed_count=s.processed,
    available_count=s.available,unavailable_count=s.unavailable,error_count=s.errors FROM (
    SELECT count(*) FILTER(WHERE status IN ('available','unavailable','error') AND finished_at IS NOT NULL)::integer processed,
      count(*) FILTER(WHERE status='available' AND finished_at IS NOT NULL)::integer available,count(*) FILTER(WHERE status='unavailable' AND finished_at IS NOT NULL)::integer unavailable,
      count(*) FILTER(WHERE status='error' AND finished_at IS NOT NULL)::integer errors FROM telegram_bot_check_items WHERE run_id=$1) s WHERE id=$1`, [id]);
}
/** Создаёт методы записи с явным владением арендой. @param database - Пул. @returns Запись и завершение. */
export function createBotHistoryWriter(database: Pool) {
  /** Блокирует запуск и выполняет одну атомарную запись только действующим владельцем. */
  async function write(projectId: number, runId: number, workerId: string, action: (client: PoolClient) => Promise<void>) {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query(`SELECT id FROM telegram_bot_check_runs WHERE project_id=$1 AND id=$2
        AND worker_id=$3 AND status='running' AND lease_until>now() FOR UPDATE`, [projectId, runId, workerId]);
      if (!locked.rowCount) throw new Error('Аренда проверки истекла или принадлежит другому процессу');
      await action(client); await recount(client, runId);
      const run = await readBotHistoryRun(client, projectId, runId);
      await client.query('COMMIT'); return run!;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  /** Фиксирует один результат до его публикации подписчикам. */
  async function saveItem(projectId: number, runId: number, workerId: string, item: TelegramBotCheckItem) {
    if (!['available','unavailable','error'].includes(item.status)) throw new Error('Недопустимый результат проверки');
    /** Повтор доставки уже сохранённого результата не переписывает историю и не требует живой аренды. */
    const previous = (await database.query(`SELECT status,reason,method,error_code,finished_at FROM telegram_bot_check_items
      WHERE project_id=$1 AND run_id=$2 AND token_id=$3`, [projectId, runId, item.tokenId])).rows[0];
    if (previous?.finished_at) {
      if (previous.status !== item.status || previous.reason !== (item.reason ?? null)
        || previous.method !== (item.method ?? null) || previous.error_code !== (item.errorCode ?? null)) throw new Error('Сохранённый результат отличается');
      return (await readBotHistoryRun(database, projectId, runId))!;
    }
    return write(projectId, runId, workerId, async client => {
      const result = await client.query(`UPDATE telegram_bot_check_items SET status=$4,reason=$5,method=$6,error_code=$7,
        started_at=COALESCE(started_at,$8::timestamptz,now()),finished_at=COALESCE($9::timestamptz,now())
        WHERE project_id=$1 AND run_id=$2 AND token_id=$3 AND status IN ('pending','running')`,
      [projectId, runId, item.tokenId, item.status, reasons.has(item.reason ?? '') ? item.reason : null,
        ['getMe','getMyCommands','setMyCommands'].includes(item.method ?? '') ? item.method : null,
        Number.isInteger(item.errorCode) ? item.errorCode : null, item.startedAt ?? null, item.finishedAt ?? null]);
      if (!result.rowCount) {
        /** Два одновременных одинаковых результата сериализуются блокировкой запуска. */
        const saved = (await client.query(`SELECT status,reason,method,error_code,finished_at FROM telegram_bot_check_items
          WHERE project_id=$1 AND run_id=$2 AND token_id=$3`, [projectId, runId, item.tokenId])).rows[0];
        if (!saved?.finished_at || saved.status !== item.status || saved.reason !== (item.reason ?? null)
          || saved.method !== (item.method ?? null) || saved.error_code !== (item.errorCode ?? null)) throw new Error('Бот не входит в проверку или результат отличается');
      }
    });
  }
  /** Завершает запуск лишь после фиксации всех результатов; при сбое закрывает ожидающие строки. */
  async function finish(projectId: number, runId: number, workerId: string, failureReason?: 'internal_error') {
    return write(projectId, runId, workerId, async client => {
      if (failureReason) await client.query(`UPDATE telegram_bot_check_items SET status='error',reason='error'
        WHERE project_id=$1 AND run_id=$2 AND status IN ('pending','running')`, [projectId, runId]);
      const pending = await client.query(`SELECT 1 FROM telegram_bot_check_items WHERE project_id=$1 AND run_id=$2 AND status IN ('pending','running') LIMIT 1`, [projectId, runId]);
      if (pending.rowCount) throw new Error('Не все результаты проверки сохранены');
      await client.query(`UPDATE telegram_bot_check_runs SET status=$3,failure_reason=$4,finished_at=now(),lease_until=NULL
        WHERE project_id=$1 AND id=$2`, [projectId, runId, failureReason ? 'failed' : 'completed', failureReason ?? null]);
    });
  }
  return { saveItem, finish };
}
