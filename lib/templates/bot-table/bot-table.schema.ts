/**
 * @fileoverview Zod-схема для валидации параметров шаблона bot-table
 * @module templates/bot-table/bot-table.schema
 */

import { z } from 'zod';

/** Схема условия WHERE */
const botTableWhereConditionSchema = z.object({
  /** Имя колонки */
  column: z.string(),
  /** Значение для сравнения (поддерживает {переменные}) */
  value: z.string(),
  /** Оператор сравнения (по умолчанию equals) */
  operator: z.string().optional().default('equals'),
});

/** Схема элемента обновления */
const botTableUpdateEntrySchema = z.object({
  /** Имя колонки */
  column: z.string(),
  /** Операция: set, increment, decrement, min, max */
  op: z.string(),
  /** Значение */
  value: z.string(),
});

/** Схема одного узла bot_table */
export const botTableEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Имя таблицы (поддерживает {переменные}) */
  tableName: z.string(),
  /** Операция: read, insert, update, upsert, delete, count, sum, max, min, avg, distinct, delete_all */
  operation: z.string(),
  /** Условия WHERE */
  where: z.array(botTableWhereConditionSchema).optional().default([]),
  /** Обновления (для update) */
  updates: z.array(botTableUpdateEntrySchema).optional().default([]),
  /** Данные строки (для insert, upsert) */
  row: z.record(z.string(), z.string()).optional().default({}),
  /** Ключ для upsert */
  key: z.string().optional().default(''),
  /** Поведение при конфликте: ignore, update, merge */
  onConflict: z.string().optional().default('ignore'),
  /** Переменная для сохранения результата */
  saveResultTo: z.string().optional().default(''),
  /** Формат результата: first_row, all_rows, scalar, count */
  resultFormat: z.string().optional().default('first_row'),
  /** Колонки для возврата (RETURNING) */
  returnColumns: z.array(z.string()).optional().default([]),
  /** Сортировка */
  orderBy: z.string().optional().default(''),
  /** Направление сортировки */
  orderDirection: z.string().optional().default('desc'),
  /** Лимит строк */
  limit: z.number().optional().default(0),
  /** ID следующего узла */
  autoTransitionTo: z.string().optional().default(''),
  /** Колонка для агрегации (sum, max, min, avg, distinct) */
  aggregateColumn: z.string().optional().default(''),
  /** Смещение строк (для пагинации) */
  offset: z.number().optional().default(0),
  /** Вернуть ID вставленной строки (для insert/upsert) */
  returnInsertedId: z.boolean().optional().default(false),
});

export type BotTableEntryValidated = z.infer<typeof botTableEntrySchema>;
