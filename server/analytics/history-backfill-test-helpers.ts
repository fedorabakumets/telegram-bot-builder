/** @fileoverview Изолированные фикстуры и ожидание статусов фонового восстановления истории. */
import type { Pool } from 'pg';
import { startAnalyticsHistoryBackfill, type AnalyticsHistoryBackfillLog, type AnalyticsHistoryBackfillOptions } from './history-backfill';
/**
 * Запускает тестовый worker с короткими паузами и наблюдаемым завершением.
 * @param pool - Изолированный тестовый пул.
 * @param options - Переопределения и наблюдатель состояний.
 * @param start - Выбранный контур, по умолчанию физические события.
 * @returns Остановка, журнал и обещание завершения.
 */
export function testHistoryWorker(pool: Pool, options: AnalyticsHistoryBackfillOptions = {}, start = startAnalyticsHistoryBackfill) {
  const logs: AnalyticsHistoryBackfillLog[] = [];
  let finish: (event: AnalyticsHistoryBackfillLog) => void = () => undefined;
  const done = new Promise<AnalyticsHistoryBackfillLog>(resolve => { finish = resolve; });
  const stop = start(pool, { pauseMs: 0, retryBaseMs: 5, lockRetryMs: 5, ...options, logger: event => {
    logs.push(event); options.logger?.(event);
    if (['completed', 'cancelled', 'failed'].includes(event.event)) finish(event);
  } });
  return { logs, done, stop };
}
/**
 * Добавляет доказуемые личные сообщения, не запуская реальных ботов.
 * @param pool - Тестовый пул.
 * @param count - Число строк.
 * @param project - Проект.
 * @param token - Бот.
 * @returns Завершение создания истории.
 */
export async function seedHistoryMessages(pool: Pool, count: number, project = 1, token = 11): Promise<void> {
  await pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at)
    SELECT $1,$2,(900000000+i)::text,'user','private',(900000000+i)::text,i,'2026-10-01'::timestamptz FROM generate_series(1,$3::integer) i`, [project, token, count]);
}
