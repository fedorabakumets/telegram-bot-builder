/**
 * @fileoverview Типы параметров шаблона узла bot_table
 * @module templates/bot-table/bot-table.params
 */

/** Условие WHERE */
export interface BotTableWhereCondition {
  /** Имя колонки */
  column: string;
  /** Значение для сравнения (поддерживает {переменные}) */
  value: string;
  /** Оператор сравнения (по умолчанию equals) */
  operator?: string;
}

/** Элемент обновления */
export interface BotTableUpdateEntry {
  /** Имя колонки */
  column: string;
  /** Операция: set, increment, decrement, min, max */
  op: string;
  /** Значение */
  value: string;
}

/** Параметры одного узла bot_table */
export interface BotTableEntry {
  /** ID узла */
  nodeId: string;
  /** Имя таблицы (поддерживает {переменные}) */
  tableName: string;
  /** Операция: read, insert, update, upsert, delete, count, sum, max, min, avg, distinct, delete_all */
  operation: string;
  /** Условия WHERE */
  where: BotTableWhereCondition[];
  /** Обновления (для update) */
  updates: BotTableUpdateEntry[];
  /** Данные строки (для insert, upsert) */
  row: Record<string, string>;
  /** Ключ для upsert */
  key: string;
  /** Поведение при конфликте: ignore, update, merge */
  onConflict: string;
  /** Переменная для сохранения результата */
  saveResultTo: string;
  /** Формат результата: first_row, all_rows, scalar, count */
  resultFormat: string;
  /** Колонки для возврата (RETURNING) */
  returnColumns: string[];
  /** Сортировка */
  orderBy: string;
  /** Направление сортировки */
  orderDirection: string;
  /** Лимит строк */
  limit: number;
  /** ID следующего узла */
  autoTransitionTo: string;
  /** Колонка для агрегации (sum, max, min, avg, distinct) */
  aggregateColumn: string;
  /** Смещение строк (для пагинации) */
  offset: number;
  /** Вернуть ID вставленной строки (для insert/upsert) */
  returnInsertedId: boolean;
}

/** Параметры шаблона (массив entries) */
export interface BotTableTemplateParams {
  /** Массив узлов bot_table */
  entries: BotTableEntry[];
}
