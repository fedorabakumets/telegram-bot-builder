/**
 * @fileoverview Spreadsheet-редактор таблицы — сетка ячеек как в Google Sheets
 * @module editor/tables/components/table-editor
 */

import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpreadsheetCell } from './spreadsheet-cell';
import { ColumnHeader } from './column-header';
import { SpreadsheetToolbar } from './spreadsheet-toolbar';
import { AddRowsFooter } from './add-rows-footer';
import { parseClipboardTsv } from '../utils/parse-clipboard';
import type { BotTable } from '../types';

/** Пропсы компонента TableEditor */
interface TableEditorProps {
  /** Таблица для редактирования */
  table: BotTable;
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
  /** Обновить ячейку */
  onUpdateCell: (rowId: number, columnId: string, value: string) => void;
  /** Импорт как новая таблица */
  onImportNew: (name: string, columns: string[], rows: string[][]) => void;
  /** Импорт строк в текущую таблицу */
  onImportRows: (rows: string[][]) => void;
}

/**
 * Spreadsheet-редактор — основная сетка данных
 * @param props - Пропсы компонента
 * @returns JSX элемент редактора
 */
export function TableEditor({
  table,
  onAddColumn,
  onAddAlphabetColumns,
  onRenameColumn,
  onDeleteColumn,
  onAddRows,
  onDeleteRow,
  onReindex,
  onUpdateCell,
  onImportNew,
  onImportRows,
}: TableEditorProps) {
  /** Режим добавления колонки */
  const [addingCol, setAddingCol] = useState(false);
  /** Имя новой колонки */
  const [newColName, setNewColName] = useState('');

  /** Подтверждение добавления колонки */
  const handleAddCol = () => {
    const name = newColName.trim();
    if (!name) return;
    onAddColumn(name);
    setNewColName('');
    setAddingCol(false);
  };

  /** Обработчик вставки из буфера (Ctrl+V) */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text/plain');
      if (!text || !text.includes('\t')) return;
      e.preventDefault();
      const { rows } = parseClipboardTsv(text);
      if (rows.length > 0) {
        onImportRows(rows);
      }
    },
    [onImportRows],
  );

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden" onPaste={handlePaste}>
      {/* Тулбар */}
      <SpreadsheetToolbar
        table={table}
        onAddAlphabet={onAddAlphabetColumns}
        onAdd100Rows={() => onAddRows(100)}
        onReindex={onReindex}
        onImportNew={onImportNew}
        onImportRows={onImportRows}
        hasSelectedTable={true}
      />

      {/* Сетка */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          {/* Шапка колонок */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60 border-b border-border">
              {/* ID колонка */}
              <th className="w-14 min-w-[56px] h-8 px-2 text-left font-medium text-muted-foreground border-r border-border bg-muted/80">
                ID
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  className="min-w-[120px] h-8 text-left font-medium text-muted-foreground border-r border-border bg-muted/60"
                >
                  <ColumnHeader
                    column={col}
                    onRename={(name) => onRenameColumn(col.id, name)}
                    onDelete={() => onDeleteColumn(col.id)}
                  />
                </th>
              ))}
              {/* Кнопка добавления колонки */}
              <th className="w-28 h-8 px-1 bg-muted/40 border-r border-border">
                {addingCol ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      placeholder="Имя"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCol();
                        if (e.key === 'Escape') setAddingCol(false);
                      }}
                      onBlur={handleAddCol}
                      className="h-6 text-xs w-20"
                    />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs gap-1 w-full"
                    onClick={() => setAddingCol(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </th>
            </tr>
          </thead>

          {/* Тело таблицы */}
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className="group border-b border-border/50 hover:bg-muted/20">
                {/* ID ячейка */}
                <td className="h-8 px-2 text-muted-foreground bg-muted/30 border-r border-border select-none">
                  {row.id}
                </td>
                {table.columns.map((col) => (
                  <td key={col.id} className="h-8 border-r border-border/50 p-0">
                    <SpreadsheetCell
                      value={row.cells[col.id] ?? ''}
                      onChange={(val) => onUpdateCell(row.id, col.id, val)}
                    />
                  </td>
                ))}
                {/* Кнопка удаления строки */}
                <td className="h-8 w-8 p-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteRow(row.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Футер — добавление строк */}
      <AddRowsFooter onAddRows={onAddRows} />
    </div>
  );
}
