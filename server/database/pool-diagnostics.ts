/** @fileoverview Безопасная диагностика ожидания и длительного удержания клиентов PostgreSQL. */
import type { Pool, PoolClient } from 'pg';
/** Таймеры активных выдач; слабые ссылки не удерживают освобождённых клиентов. */
const holdTimers = new WeakMap<PoolClient, ReturnType<typeof setTimeout>>();
/** Места выдачи содержат только кадры стека, без SQL и параметров подключения. */
const holdOwners = new WeakMap<PoolClient, string>();
/** Уже подключённые пулы защищены от повторных подписок и обёрток. */
const installed = new WeakSet<Pool>();
/**
 * Возвращает состояние пула без строк подключения и текста SQL.
 * @param pool - Наблюдаемый пул PostgreSQL
 * @returns Число соединений, занятых клиентов, очередь и лимит пула
 */
export function snapshotPool(pool: Pool) {
  return { total: pool.totalCount, idle: pool.idleCount, acquired: Math.max(0, pool.totalCount - pool.idleCount),
    waiting: pool.waitingCount, max: pool.options.max ?? 10 };
}
/**
 * Отключает предупреждение для текущей выдачи с намеренно длительным удержанием.
 * @param client - Клиент постоянной подписки или блокировки задания
 * @returns Ничего; следующая выдача снова отслеживается
 */
export function suppressPoolClientHoldWarning(client: PoolClient): void {
  const timer = holdTimers.get(client);
  if (timer) clearTimeout(timer);
  holdTimers.delete(client);
  holdOwners.delete(client);
}
/**
 * Учитывает обе сигнатуры connect и освобождение через события самого pg.
 * @param pool - Наблюдаемый пул PostgreSQL
 * @param log - Обработчик безопасного снимка
 * @param holdWarningMs - Порог удержания; ноль отключает предупреждения
 * @returns Ничего; устанавливает обёртку получения клиента и подписки
 */
export function installPoolAcquireDiagnostics(pool: Pool, log: (value: object) => void = value => console.warn('[database-pool]', value), holdWarningMs = 30000): void {
  if (installed.has(pool)) return;
  installed.add(pool);
  const original = pool.connect.bind(pool);
  /** Отправляет событие, не позволяя диагностике нарушить работу пула. */
  const emit = (value: object) => { try { log(value); } catch { /* Ошибка диагностики не влияет на запрос. */ } };
  if (typeof pool.on === 'function') {
    pool.on('acquire', (client: PoolClient) => {
      suppressPoolClientHoldWarning(client);
      if (holdWarningMs <= 0) return;
      const started = Date.now();
      const timer = setTimeout(() => {
        holdTimers.delete(client);
        emit({ event: 'client_held', owner: holdOwners.get(client) ?? 'unknown', durationMs: Date.now() - started, ...snapshotPool(pool) });
      }, holdWarningMs);
      timer.unref?.();
      holdTimers.set(client, timer);
    });
    pool.on('release', (_error: Error | undefined, client: PoolClient) => suppressPoolClientHoldWarning(client));
    pool.on('remove', (client: PoolClient) => suppressPoolClientHoldWarning(client));
  }
  /** Публикует числовые показатели, не включая потенциальные секреты ошибки. */
  const report = (error: Error | undefined, started: number) => {
    if (error && /timeout|timed out/i.test(error.message)) {
      emit({ event: 'acquire_timeout', durationMs: Date.now() - started, ...snapshotPool(pool) });
    }
  };
  /** Сохраняет клиента, обе сигнатуры и исходную функцию освобождения pg. */
  function connect(callback?: (error: Error | undefined, client: PoolClient | undefined, release: (error?: Error | boolean) => void) => void): Promise<PoolClient> | void {
    const started = Date.now();
    const owner = new Error().stack?.split('\n').slice(2).filter(line => /^\s*at /.test(line) && !/node:|node_modules|pool-diagnostics\.ts/.test(line)).slice(0, 4).map(line => line.trim()).join(' | ') ?? 'unknown';
    if (callback) return original((error, client, release) => { report(error, started); if (client) holdOwners.set(client, owner); callback(error, client, release); });
    return original().then(client => { holdOwners.set(client, owner); return client; }).catch(error => { report(error, started); throw error; });
  }
  pool.connect = connect as Pool['connect'];
}
