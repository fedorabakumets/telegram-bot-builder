/**
 * @fileoverview Исполнитель SQL без импорта пула приложения
 * @module server/database/bot-tables/queryable
 */

/** Результат параметризованного запроса */
export interface QueryResult<T> {
  /** Строки результата */
  rows: T[];
  /** Число затронутых строк */
  rowCount: number | null;
}

/** Пул или клиент с методом query */
export interface Queryable {
  /**
   * Выполняет SQL с параметрами
   * @param text - Текст запроса
   * @param values - Параметры
   * @returns Строки и счётчик
   */
  query<T = Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}
