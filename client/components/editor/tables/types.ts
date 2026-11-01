/**
 * @fileoverview Типы для вкладки "Таблицы" — клиентские модели
 * @module editor/tables/types
 */

import type { TableColumnSettings } from '@shared/table-column-settings';
import type { CanvasSheet } from '@shared/schema';

/** Колонка таблицы */
export interface TableColumn {
  /** Подпись, тип и ограничения; внутреннее имя хранится отдельно. */
  settings?: TableColumnSettings;
  /** Уникальный идентификатор колонки (строковый для совместимости с UI) */
  id: string;
  /** Имя колонки (отображается в шапке) */
  name: string;
}

/** Строка таблицы — все значения строковые */
export interface TableRow {
  /** Внутренний ID строки (для операций: удаление, обновление) */
  id: number;
  /** Локальный индекс строки в таблице (отображается пользователю) */
  rowIndex: number;
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
  /** Текущие листы сценария для названий нод в контенте. */
  sheets?: CanvasSheet[];
  /** Идентификатор проекта */
  projectId: number;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик выбора токена */
  onSelectToken?: (tokenId: number | null) => void;
}
