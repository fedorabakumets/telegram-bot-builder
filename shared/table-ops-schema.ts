/** @fileoverview Общий контракт пакетных операций таблиц для MCP и HTTP. */
import { z } from 'zod';
/** Положительный идентификатор строки или столбца. */
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
/** Значения ячеек сохраняют совместимость HTTP с нормализацией на сервере. */
const data = z.record(z.string(), z.unknown());
/** Операция с явным различителем; поля соответствуют HTTP, а не внутреннему SQL. */
export const tableOperationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add_column'), name: z.string(), position: z.number().int().optional() }),
  z.object({ op: z.literal('rename_column'), column_id: id, name: z.string() }),
  z.object({ op: z.literal('delete_column'), column_id: id }),
  z.object({ op: z.literal('add_rows'), rows: z.array(z.object({ data, row_index: z.number().int().optional() })) }),
  z.object({ op: z.literal('update_row'), row_id: id, data }),
  z.object({ op: z.literal('patch_row'), row_id: id, data }),
  z.object({ op: z.literal('delete_row'), row_id: id }),
  z.object({ op: z.literal('reindex') }),
]);
/** До 50 операций; дополнительный суммарный бюджет строк проверяется сервером. */
export const tableOperationsSchema = z.array(tableOperationSchema).min(1).max(50);
