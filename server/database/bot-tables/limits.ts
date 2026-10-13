/**
 * @fileoverview Пределы запросов и изменений пользовательских таблиц
 * @module server/database/bot-tables/limits
 */

/** Имя служебной таблицы сценария */
export const CONTENT_TABLE_NAME = "_content";

/** Сколько условий можно передать за один запрос */
export const MAX_FILTERS = 5;

/** Размер страницы по умолчанию */
export const DEFAULT_ROW_LIMIT = 100;

/** Верхняя граница страницы */
export const MAX_ROW_LIMIT = 500;

/** Максимальная длина значения фильтра */
export const MAX_FILTER_VALUE = 500;

/** Максимальная длина ячейки */
export const MAX_CELL_LENGTH = 10000;

/** Сколько строк можно добавить за один вызов */
export const MAX_ADD_ROWS = 200;

/** Сколько операций в одном пакете */
export const MAX_OPS = 50;

/** Таймаут SQL внутри транзакции чтения и пакета */
export const SQL_TIMEOUT = "5s";

/** Длина имени таблицы и столбца */
export const MAX_NAME_LENGTH = 255;

/**
 * Запрет переименования и удаления служебной таблицы
 * @param name - Текущее имя
 * @returns Текст ошибки или null
 */
export function contentGuard(name: string): string | null {
  if (name === CONTENT_TABLE_NAME) {
    return "Служебную таблицу _content нельзя переименовать или удалить";
  }
  return null;
}
