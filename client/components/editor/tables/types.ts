/**
 * @fileoverview Типы для вкладки "Таблицы" — клиентские модели
 * @module editor/tables/types
 */

/** Колонка таблицы */
export interface TableColumn {
  /** Уникальный идентификатор колонки (строковый для совместимости с UI) */
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

/** Определение таблицы (клиентская модель) */
export interface BotTable {
  /** Уникальный идентификатор таблицы (строковый для совместимости с UI) */
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
