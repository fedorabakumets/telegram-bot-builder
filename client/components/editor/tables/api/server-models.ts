/** @fileoverview Модели таблиц, столбцов и строк, возвращаемые сервером. */
import type { TableColumnSettings } from '@shared/table-column-settings';

/** Серверная модель таблицы */
export interface ServerTable {
  /** ID таблицы */
  id: number;
  /** ID проекта */
  projectId: number;
  /** Имя таблицы */
  name: string;
  /** Дата создания */
  createdAt: string;
}

/** Серверная модель колонки */
export interface ServerColumn {
  /** Пользовательские настройки отображения и значений. */
  settings?: TableColumnSettings;
  /** ID колонки */
  id: number;
  /** ID таблицы */
  tableId: number;
  /** Имя колонки */
  name: string;
  /** Позиция */
  position: number;
}

/** Серверная модель строки */
export interface ServerRow {
  /** ID строки */
  id: number;
  /** ID таблицы */
  tableId: number;
  /** Индекс строки */
  rowIndex: number;
  /** Данные ячеек */
  data: Record<string, string>;
}

