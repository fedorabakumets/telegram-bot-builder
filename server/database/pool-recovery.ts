/** @fileoverview Ограниченная проверка восстановления PostgreSQL без потери клиентов и шторма таймеров. */
import type { ClientConfig, Pool, QueryConfig } from 'pg';
/**
 * Проверяет соединение и уничтожает непригодного клиента даже при ошибке SELECT.
 * @param pool - Проверяемый пул PostgreSQL
 * @returns Завершение проверки либо исходная ошибка
 */
export async function probePool(pool: Pick<Pool, 'connect'>): Promise<void> {
  const client = await pool.connect();
  let failed = false;
  /** Таймаут поддерживается драйвером pg, но отсутствует в базовом QueryConfig. */
  const query: QueryConfig & Pick<ClientConfig, 'query_timeout'> = { text: 'SELECT 1', query_timeout: 5000 };
  try { await client.query(query); }
  catch (error) { failed = true; throw error; }
  finally { client.release(failed); }
}
/**
 * Повторяет проверку с ограниченной паузой, без параллельных таймеров и позднего успеха после остановки.
 * @param pool - Проверяемый пул PostgreSQL
 * @param setActive - Публикация подтверждённой доступности базы
 * @param delayMs - Начальная пауза между проверками, далее растёт до 30 секунд
 * @returns Управление запуском восстановления и окончательной остановкой
 */
export function createPoolRecovery(pool: Pick<Pool, 'connect'>, setActive: (active: boolean) => void, delayMs = 5000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false, stopped = false;
  let retryDelayMs = delayMs;
  /** Ставит единственную отложенную проверку на серию ошибок. */
  function schedule(): void {
    if (stopped) return;
    setActive(false);
    if (timer || running) return;
    timer = setTimeout(async () => {
      timer = undefined; running = true;
      let retry = false;
      try { await probePool(pool); retryDelayMs = delayMs; if (!stopped) setActive(true); }
      catch { retry = true; retryDelayMs = Math.min(30000, retryDelayMs * 2); if (!stopped) setActive(false); }
      finally { running = false; }
      if (retry && !stopped) schedule();
    }, retryDelayMs);
    timer.unref?.();
  }
  /** Запрещает новые проверки и отменяет ещё не начавшуюся. */
  function stop(): void {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  return { schedule, stop };
}

