/**
 * @fileoverview Типы для вкладки "Таблицы" — spreadsheet-подобный интерфейс
 * @module editor/tables/types
 */

/** Определение колонки таблицы */
export interface TableColumn {
  /** Уникальный идентификатор колонки */
  id: string;
  /** Имя колонки (отображается в шапке) */
  name: string;
}

/** Строка таблицы — все значения строковые */
export interface TableRow {
  /** Автоинкрементный числовой ID строки */
  id: number;
  /** Значения ячеек: ключ = columnId, значение = строка */
  cells: Record<string, string>;
}

/** Определение таблицы */
export interface BotTable {
  /** Уникальный идентификатор таблицы */
  id: string;
  /** Имя таблицы */
  name: string;
  /** Колонки таблицы (без учёта ID — он автоматический) */
  columns: TableColumn[];
  /** Строки данных */
  rows: TableRow[];
  /** Счётчик для автоинкремента ID строк */
  nextRowId: number;
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
