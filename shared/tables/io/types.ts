/**
 * @fileoverview Нейтральные типы обмена CSV и JSON для таблиц
 * @module shared/tables/io/types
 */

import type { TableColumnSettings } from '../../table-column-settings';

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
  /** Подписи и типы столбцов в исходном порядке, если они были выгружены. */
  columnSettings?: TableColumnSettings[];
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
