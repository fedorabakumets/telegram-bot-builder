/**
 * @fileoverview Разбор одной операции пакета
 * @module server/database/bot-tables/parse-one-op
 */

/**
 * Разбирает одну операцию
 * @param item - Элемент массива
 * @returns Операция или ошибка
 */
export function parseOneOp(item: unknown): { message: string } | { op: string; [key: string]: unknown } {
  if (!item || typeof item !== "object") return { message: "Некорректная операция" };
  const source = item as Record<string, unknown>;
  const op = source.op;
  if (op === "reindex") return { op };
  if (op === "add_column" && typeof source.name === "string") {
    return { op, name: source.name, position: typeof source.position === "number" ? source.position : undefined };
  }
  if (op === "rename_column" && typeof source.column_id === "number" && typeof source.name === "string") {
    return { op, columnId: source.column_id, name: source.name };
  }
  if (op === "delete_column" && typeof source.column_id === "number") return { op, columnId: source.column_id };
  if (op === "delete_row" && typeof source.row_id === "number") return { op, rowId: source.row_id };
  if ((op === "update_row" || op === "patch_row") && typeof source.row_id === "number" && isRecord(source.data)) {
    return { op, rowId: source.row_id, data: source.data };
  }
  if (op === "add_rows" && Array.isArray(source.rows)) {
    return {
      op,
      rows: source.rows.map((row) => {
        const record = row && typeof row === "object" ? row as Record<string, unknown> : {};
        return {
          data: isRecord(record.data) ? record.data : {},
          rowIndex: typeof record.row_index === "number" ? record.row_index : undefined,
        };
      }),
    };
  }
  return { message: "Неизвестная операция" };
}

/**
 * Проверяет, что значение — объект ячеек
 * @param value - Поле data
 * @returns Признак объекта
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
