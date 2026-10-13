/**
 * @fileoverview Нейтральные типы обмена CSV и JSON для таблиц
 * @module shared/tables/io/types
 */

/** Колонка для сериализации: идентификатор и имя */
export interface IoColumn {
  /** Идентификатор столбца (строка, как ключ ячейки) */
  id: string;
  /** Имя столбца в файле */
  name: string;
}

/** Строка для сериализации */
export interface IoRow {
  /** Ячейки: ключ — идентификатор столбца */
  cells: Record<string, string>;
}

/** Одна таблица в общем JSON версии 1 */
export interface ExportedTable {
  /** Имя таблицы */
  name: string;
  /** Имена столбцов по порядку */
  columns: string[];
  /** Строки: значения в порядке столбцов */
  rows: string[][];
}

/** Файл всех таблиц проекта */
export interface AllTablesExport {
  /** Версия формата */
  version: 1;
  /** Момент выгрузки в ISO */
  exportedAt: string;
  /** Таблицы */
  tables: ExportedTable[];
}
