/**
 * @fileoverview Проверка ячеек по схеме столбцов
 * @module server/database/bot-tables/validate-cells
 */

import { CONTENT_TABLE_NAME, MAX_CELL_LENGTH, MAX_NAME_LENGTH } from "./limits";

/** Успешная проверка ячеек */
export interface CellsOk {
  /** Признак успеха */
  ok: true;
  /** Очищенные ячейки */
  data: Record<string, string>;
}

/** Ошибка проверки */
export interface CellsFail {
  /** Признак отказа */
  ok: false;
  /** Текст для клиента */
  message: string;
}

/**
 * Проверяет имя таблицы или столбца
 * @param name - Входное значение
 * @param reservedContent - Запрещать имя _content
 * @returns Имя или ошибка
 */
export function parseEntityName(name: unknown, reservedContent: boolean): string | CellsFail {
  if (typeof name !== "string") return { ok: false, message: "Название обязательно" };
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, message: `Название от 1 до ${MAX_NAME_LENGTH} символов` };
  }
  if (reservedContent && trimmed === CONTENT_TABLE_NAME) {
    return { ok: false, message: "Имя _content зарезервировано" };
  }
  return trimmed;
}

/**
 * Проверяет объект ячеек: пустая строка допустима, чужой столбец — нет
 * @param input - Тело data
 * @param columnIds - Допустимые идентификаторы столбцов
 * @returns Ячейки или ошибка
 */
export function validateCells(input: unknown, columnIds: ReadonlySet<string>): CellsOk | CellsFail {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Поле data обязательно и должно быть объектом" };
  }
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!columnIds.has(key)) return { ok: false, message: `Неизвестный столбец: ${key}` };
    if (typeof value !== "string") return { ok: false, message: `Значение столбца ${key} должно быть строкой` };
    if (value.length > MAX_CELL_LENGTH) return { ok: false, message: "Слишком длинное значение ячейки" };
    data[key] = value;
  }
  return { ok: true, data };
}
