/** @fileoverview Контракт редактора таблицы и обработчиков операций. */
import type { TableCellEdit } from '@shared/table-cell-edit';
import type { CanvasSheet } from '@shared/schema';
import type { BotTable } from './types';
import type { ReactNode } from 'react';

/** Параметры редактора таблицы. */
export interface TableEditorProps {
  /** Возврат к списку в общей строке действий на узком экране. */
  navigation?: ReactNode;
  /** Идёт первая загрузка столбцов или строк. */
  loading?: boolean;
  /** Ошибка загрузки данных. */
  loadError?: string;
  /** Повторение запроса чтения. */
  onRetryLoad?: () => void;
  /** Листы сценария для названий и проверки существования нод. */
  sheets?: CanvasSheet[];
  /** Проект для перехода к нодам из таблицы контента. */
  projectId: number;
  /** Таблица для редактирования */
  table: BotTable;
  /** Режим только чтение (для системных таблиц) */
  readOnly?: boolean;
  /** Таблица контента (_content) — особый режим */
  isContentTable?: boolean;
  /** Информация о контексте системной таблицы (токен/проект) */
  systemInfo?: string;
  /** Добавить именованную колонку */
  onAddColumn: (name: string) => void;
  /** Добавить 26 буквенных колонок */
  onAddAlphabetColumns: () => void;
  /** Переименовать колонку */
  onRenameColumn: (columnId: string, name: string) => void;
  /** Удалить колонку */
  onDeleteColumn: (columnId: string) => void;
  /** Добавить N строк */
  onAddRows: (count: number) => void;
  /** Удалить строку */
  onDeleteRow: (rowId: number) => void;
  /** Перезаписать ID */
  onReindex: () => void;
  /** Сохранить диапазон ячеек атомарно. */
  onUpdateCells: (edits: TableCellEdit[]) => Promise<void>;
  /** Обновить ячейку */
  onUpdateCell: (rowId: number, columnId: string, value: string, expected?: string) => Promise<void>;
  /** Импорт как новая таблица */
  onImportNew: (name: string, columns: string[], rows: string[][]) => Promise<void>;
  /** Импорт строк в текущую таблицу */
  onImportRows: (rows: string[][]) => Promise<void>;
}

