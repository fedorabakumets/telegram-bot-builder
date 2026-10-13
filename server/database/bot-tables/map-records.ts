/**
 * @fileoverview Приведение строк PostgreSQL к виду API
 * @module server/database/bot-tables/map-records
 */

/** Таблица в ответе API */
export interface TableRecord {
  /** Идентификатор */
  id: number;
  /** Проект */
  projectId: number;
  /** Имя */
  name: string;
  /** Момент создания */
  createdAt: Date | string | null;
}

/** Столбец в ответе API */
export interface ColumnRecord {
  /** Идентификатор */
  id: number;
  /** Таблица */
  tableId: number;
  /** Имя */
  name: string;
  /** Порядок */
  position: number;
}

/** Строка в ответе API */
export interface RowRecord {
  /** Идентификатор */
  id: number;
  /** Таблица */
  tableId: number;
  /** Порядок */
  rowIndex: number;
  /** Ячейки: ключ — идентификатор столбца */
  data: Record<string, string>;
}

/** Сырая таблица из SQL */
interface RawTable {
  /** Идентификатор */
  id: number;
  /** Проект */
  project_id: number;
  /** Имя */
  name: string;
  /** Создание */
  created_at: Date | string | null;
}

/** Сырой столбец */
interface RawColumn {
  /** Идентификатор */
  id: number;
  /** Таблица */
  table_id: number;
  /** Имя */
  name: string;
  /** Порядок */
  position: number;
}

/** Сырая строка */
interface RawRow {
  /** Идентификатор */
  id: number;
  /** Таблица */
  table_id: number;
  /** Порядок */
  row_index: number;
  /** JSONB */
  data: Record<string, unknown> | null;
}

/**
 * Приводит ячейки к строкам
 * @param data - JSONB
 * @returns Объект строковых ячеек
 */
export function stringCells(data: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data || typeof data !== "object") return out;
  for (const [key, value] of Object.entries(data)) {
    out[key] = value === undefined || value === null ? "" : String(value);
  }
  return out;
}

/**
 * Маппит таблицу
 * @param row - Сырая строка
 * @returns Запись API
 */
export function mapTable(row: RawTable): TableRecord {
  return { id: row.id, projectId: row.project_id, name: row.name, createdAt: row.created_at };
}

/**
 * Маппит столбец
 * @param row - Сырая строка
 * @returns Запись API
 */
export function mapColumn(row: RawColumn): ColumnRecord {
  return { id: row.id, tableId: row.table_id, name: row.name, position: row.position };
}

/**
 * Маппит строку таблицы
 * @param row - Сырая строка
 * @returns Запись API
 */
export function mapRow(row: RawRow): RowRecord {
  return {
    id: row.id,
    tableId: row.table_id,
    rowIndex: row.row_index,
    data: stringCells(row.data),
  };
}
