/** @fileoverview Безопасные числовые метрики ожидания подключения PostgreSQL. */
import type { Pool, PoolClient } from 'pg';
/**
 * Возвращает состояние пула без строк подключения и текста SQL.
 * @param pool - Наблюдаемый пул PostgreSQL
 * @returns Число соединений, очередь и лимит пула
 */
export function snapshotPool(pool: Pool) {
  return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, max: pool.options.max ?? 10 };
}
/**
 * Фиксирует таймаут получения клиента, сохраняя обе сигнатуры pg и поведение pool.query.
 * @param pool - Наблюдаемый пул PostgreSQL
 * @param log - Безопасный обработчик числового снимка
 * @returns Ничего; устанавливает обёртку получения клиента
 */
export function installPoolAcquireDiagnostics(pool: Pool, log: (value: object) => void = value => console.warn('[database-pool]', value)): void {
  const original = pool.connect.bind(pool);
  /** Публикует только числовые показатели, не включая потенциальные секреты ошибки. */
  const report = (error: Error | undefined, started: number) => {
    if (error && /timeout|timed out/i.test(error.message)) {
      try { log({ event: 'acquire_timeout', durationMs: Date.now() - started, ...snapshotPool(pool) }); }
      catch { /* Диагностика не меняет результат получения клиента. */ }
    }
  };
  /** Передаёт ошибки и клиента вызывающему без изменения владения соединением. */
  function connect(callback?: (error: Error | undefined, client: PoolClient | undefined, release: (error?: Error | boolean) => void) => void): Promise<PoolClient> | void {
    const started = Date.now();
    if (callback) return original((error, client, release) => { report(error, started); callback(error, client, release); });
    return original().catch(error => { report(error, started); throw error; });
  }
  pool.connect = connect as Pool['connect'];
}
