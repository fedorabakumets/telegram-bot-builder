/**
 * @fileoverview Короткая транзакция чтения для графика таблицы.
 */
import type { Pool, PoolClient } from 'pg';

/**
 * Выполняет чтение в транзакции с ограничением времени.
 * @param pool - Пул базы.
 * @param read - Запрос внутри транзакции.
 * @returns Результат чтения.
 */
export async function withChartRead<T>(pool: Pool, read: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10000ms'");
    const value = await read(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* Откат не заменяет ответ вызывающему. */ }
    throw error;
  } finally {
    client.release();
  }
}
