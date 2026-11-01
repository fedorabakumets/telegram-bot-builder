/** @fileoverview Контракт условного изменения ячеек таблицы для единичных и массовых операций. */
import { z } from 'zod';
/** Одна ячейка с исходным значением, показанным пользователю. */
export const tableCellEditSchema = z.object({
  /** Идентификатор строки. */
  rowId: z.number().int().positive(),
  /** Идентификатор столбца. */
  columnId: z.string().regex(/^[1-9]\d*$/),
  /** Ожидаемое исходное значение. */
  before: z.string().max(1000000),
  /** Новое значение. */
  after: z.string().max(10000),
});
/** Изменение ячейки с проверкой актуальности данных. */
export type TableCellEdit = z.infer<typeof tableCellEditSchema>;
/** Запрос атомарного изменения диапазона. */
export const tableCellBatchSchema = z.object({
  /** Все ячейки одной операции. */
  edits: z.array(tableCellEditSchema).min(1).max(5000),
});
