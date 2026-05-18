/**
 * @fileoverview Spreadsheet-редактор таблицы — сетка ячеек с клавиатурной навигацией
 * @module editor/tables/components/table-editor
 */

import { useState, useCallback } from 'react';
import { Plus, Trash2, Lock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpreadsheetCell } from './spreadsheet-cell';
import type { NavigateDirection } from './spreadsheet-cell';
import { ColumnHeader } from './column-header';
import { SpreadsheetToolbar } from './spreadsheet-toolbar';
import { AddRowsFooter } from './add-rows-footer';
import { parseClipboardTsv } from '../utils/parse-clipboard';
import { tableToCsv } from '../utils/export-csv';
import { downloadFile } from '../utils/download-file';
import type { BotTable } from '../types';

/** Пропсы компонента TableEditor */
interface TableEditorProps {
  /** Таблица для редактирования */
  table: BotTable;
  /** Режим только чтение (для системных таблиц) */
  readOnly?: boolean;
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
  /** Обновить ячейку */
  onUpdateCell: (rowId: number, columnId: string, value: string) => void;
  /** Импорт как новая таблица */
  onImportNew: (name: string, columns: string[], rows: string[][]) => void;
  /** Импорт строк в текущую таблицу */
  onImportRows: (rows: string[][]) => void;
}

/** Координаты активной ячейки */
interface FocusedCell {
  /** Индекс строки (0-based) */
  rowIndex: number;
  /** Индекс колонки (0-based) */
  colIndex: number;
}

/**
 * Spreadsheet-редактор — основная сетка данных с навигацией
 * @param props - Пропсы компонента
 * @returns JSX элемент редактора
 */
export function TableEditor({
  table,
  readOnly,
  systemInfo,
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
  /** Координаты ячейки в фокусе */
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);

  /** Подтверждение добавления колонки */
  const handleAddCol = () => {
    const name = newColName.trim();
    if (!name) return;
    onAddColumn(name);
    setNewColName('');
    setAddingCol(false);
  };

  /** Навигация между ячейками с учётом границ таблицы */
  const navigate = useCallback(
    (direction: NavigateDirection) => {
      setFocusedCell((prev) => {
        if (!prev) return null;
        const maxRow = table.rows.length - 1;
        const maxCol = table.columns.length - 1;
        let { rowIndex, colIndex } = prev;

        switch (direction) {
          case 'right':
            if (colIndex < maxCol) {
              colIndex++;
            } else if (rowIndex < maxRow) {
              rowIndex++;
              colIndex = 0;
            }
            break;
          case 'left':
            if (colIndex > 0) {
              colIndex--;
            } else if (rowIndex > 0) {
              rowIndex--;
              colIndex = maxCol;
            }
            break;
          case 'down':
            if (rowIndex < maxRow) rowIndex++;
            break;
          case 'up':
            if (rowIndex > 0) rowIndex--;
            break;
        }
        return { rowIndex, colIndex };
      });
    },
    [table.rows.length, table.columns.length],
  );

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
    <div className="flex flex-col h-full flex-1 overflow-hidden" onPaste={readOnly ? undefined : handlePaste}>
      {/* Бейдж «только чтение» для системных таблиц */}
      {readOnly && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200/40 dark:border-blue-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Системная таблица — данные токена, только чтение
              </span>
              {systemInfo && (
                <span className="text-[10px] text-muted-foreground">
                  {systemInfo}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              const csv = tableToCsv(table.columns, table.rows);
              downloadFile(csv, `${table.name.replace('🔒 ', '')}.csv`, 'text/csv;charset=utf-8');
            }}
          >
            <Download className="h-3 w-3" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              const data = table.rows.map(row => {
                const obj: Record<string, string> = {};
                table.columns.forEach(col => { obj[col.name] = row.cells[col.id] ?? ''; });
                return obj;
              });
              downloadFile(JSON.stringify(data, null, 2), `${table.name.replace('🔒 ', '')}.json`, 'application/json');
            }}
          >
            <Download className="h-3 w-3" />
            JSON
          </Button>
        </div>
      )}

      {/* Тулбар (скрыт в режиме только чтение) */}
      {!readOnly && (
        <SpreadsheetToolbar
          table={table}
          onAddAlphabet={onAddAlphabetColumns}
          onAdd100Rows={() => onAddRows(100)}
          onReindex={onReindex}
          onImportNew={onImportNew}
          onImportRows={onImportRows}
          hasSelectedTable={true}
        />
      )}

      {/* Сетка */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60 border-b border-border">
              <th className="w-14 min-w-[56px] h-8 px-2 text-left font-medium text-muted-foreground border-r border-border bg-muted/80">
                №
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  className="min-w-[120px] h-8 text-left font-medium text-muted-foreground border-r border-border bg-muted/60"
                >
                  {readOnly ? (
                    <span className="px-2 text-xs">{col.name}</span>
                  ) : (
                    <ColumnHeader
                      column={col}
                      onRename={(name) => onRenameColumn(col.id, name)}
                      onDelete={() => onDeleteColumn(col.id)}
                    />
                  )}
                </th>
              ))}
              {!readOnly && (
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
              )}
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={row.id} className="group border-b border-border/50 hover:bg-muted/20">
                <td className="h-8 px-2 text-muted-foreground bg-muted/30 border-r border-border select-none">
                  {row.rowIndex}
                </td>
                {table.columns.map((col, colIdx) => (
                  <td key={col.id} className="h-8 border-r border-border/50 p-0">
                    {readOnly ? (
                      <span className="block px-2 py-1 text-xs truncate">
                        {row.cells[col.id] ?? ''}
                      </span>
                    ) : (
                      <SpreadsheetCell
                        value={row.cells[col.id] ?? ''}
                        onChange={(val) => onUpdateCell(row.id, col.id, val)}
                        isFocused={
                          focusedCell?.rowIndex === rowIdx && focusedCell?.colIndex === colIdx
                        }
                        onNavigate={navigate}
                        onFocus={() => setFocusedCell({ rowIndex: rowIdx, colIndex: colIdx })}
                        onBlurCell={() => setFocusedCell(null)}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
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
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Футер — добавление строк (скрыт в режиме только чтение) */}
      {!readOnly && <AddRowsFooter onAddRows={onAddRows} />}
      {readOnly && table.rows.length >= 200 && (
        <div className="px-4 py-2 border-t border-border/50 flex items-center justify-center">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => (window as any).__loadMoreMessages?.()}
          >
            Загрузить ещё (+200)
          </Button>
        </div>
      )}
    </div>
  );
}
