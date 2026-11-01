/** @fileoverview Операции структуры пользовательской таблицы и импорт с предпросмотром. */
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { ImportDialog } from './import-dialog';
import type { BotTable } from '../types';
/** Свойства панели операций структуры. */
interface SpreadsheetToolbarProps {
  /** Текущая таблица. */
  table: BotTable;
  /** Создание буквенных столбцов. */
  onAddAlphabet: () => void;
  /** Добавление ста строк. */
  onAdd100Rows: () => void;
  /** Перенумерация строк. */
  onReindex: () => void;
  /** Импорт новой таблицы. */
  onImportNew: (name: string, columns: string[], rows: string[][]) => Promise<void>;
  /** Добавление строк из файла. */
  onImportRows: (rows: string[][]) => Promise<void>;
  /** Текущая таблица доступна. */
  hasSelectedTable: boolean;
}
/**
 * Предоставляет редко используемые действия отдельно от редактирования ячеек.
 * @param props - Обработчики структуры и импорта.
 * @returns Панель действий таблицы.
 */
export function SpreadsheetToolbar({ table, onAddAlphabet, onAdd100Rows, onReindex, onImportNew, onImportRows, hasSelectedTable }: SpreadsheetToolbarProps) {
  const [importOpen, setImportOpen] = useState(false);
  const control = 'tables-control rounded-md border border-border px-3 py-1 text-sm';
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={control}>Структура</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="table-actions-menu">
      <DropdownMenuItem onSelect={onAddAlphabet}>Добавить столбцы A–Z</DropdownMenuItem>
      <DropdownMenuItem onSelect={onAdd100Rows}>Добавить 100 строк</DropdownMenuItem>
      <DropdownMenuItem onSelect={onReindex}>Перенумеровать строки</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setImportOpen(true)}>Импорт файла</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    {importOpen && <ImportDialog open onClose={() => setImportOpen(false)} onImportNew={onImportNew} onImportRows={onImportRows} hasSelectedTable={hasSelectedTable} targetColumns={table.columns} />}
  </>;
}
