/** @fileoverview Заголовок пользовательского столбца с отдельной подписью и настройками типа. */
import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { ColumnSettingsDialog } from './column-settings-dialog';
import { getColumnTitle } from '../utils/display-labels';
import type { TableColumn } from '../types';
/** Свойства заголовка столбца. */
interface ColumnHeaderProps {
  /** Данные столбца. */
  column: TableColumn;
  /** Проект для сохранения настроек. */
  projectId: number;
  /** Таблица для сохранения настроек. */
  tableId: string;
  /** Удаление столбца. */
  onDelete: () => void;
}
/**
 * Показывает подпись и предоставляет настройки без изменения имени бота.
 * @param props - Столбец и контекст таблицы.
 * @returns Заголовок и диалог настроек.
 */
export function ColumnHeader({ column, projectId, tableId, onDelete }: ColumnHeaderProps) {
  const [open, setOpen] = useState(false);
  return <div className="flex min-w-0 flex-1 items-center gap-1 px-2">
    <button type="button" title={`Настройки столбца ${column.name}`} aria-label={`Настройки столбца: ${getColumnTitle(column)}`} onClick={() => setOpen(true)} className="tables-control flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-2 text-left text-sm">
      <span className="truncate">{getColumnTitle(column)}</span><Settings2 className="h-3 w-3 shrink-0 text-muted-foreground" />
    </button>
    <details className="relative"><summary aria-label={`Действия столбца ${column.name}`} className="cursor-pointer list-none px-1">⋮</summary><div className="absolute left-0 top-full z-30 rounded-md border border-border bg-background p-2"><button type="button" onClick={onDelete} className="whitespace-nowrap rounded px-3 py-2 text-sm text-destructive">Удалить столбец</button></div></details>
    {open && <ColumnSettingsDialog projectId={projectId} tableId={tableId} column={column} onClose={() => setOpen(false)} />}
  </div>;
}
