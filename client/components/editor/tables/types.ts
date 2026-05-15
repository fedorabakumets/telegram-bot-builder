/**
 * @fileoverview Типы для вкладки "Таблицы"
 * @module editor/tables/types
 */

/** Тип колонки таблицы */
export type ColumnType = 'text' | 'number' | 'boolean';

/** Определение колонки */
export interface TableColumn {
  /** Уникальный идентификатор колонки */
  id: string;
  /** Имя колонки */
  name: string;
  /** Тип данных */
  type: ColumnType;
}

/** Строка таблицы — объект с ключами = id колонок */
export interface TableRow {
  /** Уникальный идентификатор строки */
  id: string;
  /** Значения ячеек: ключ = columnId, значение = данные */
  cells: Record<string, string | number | boolean>;
}

/** Определение таблицы */
export interface BotTable {
  /** Уникальный идентификатор таблицы */
  id: string;
  /** Имя таблицы */
  name: string;
  /** Колонки таблицы */
  columns: TableColumn[];
  /** Строки данных */
  rows: TableRow[];
}

/** Пропсы компонента TablesPanel */
export interface TablesPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}
