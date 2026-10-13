/**
 * @fileoverview Доступ к пулу для маршрутов таблиц
 * @module routes/tables/table-db
 */

import { pool } from "../../database/db";
import type { Queryable } from "../../database/bot-tables/queryable";

/**
 * Выполняет работу на отдельном соединении
 * @param fn - Функция с клиентом
 * @returns Результат функции
 */
export async function withClient<T>(fn: (db: Queryable) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** Пул как исполнитель одиночных запросов */
export const tablePool: Queryable = pool;
