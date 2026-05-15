/**
 * @fileoverview Тулбар spreadsheet — быстрые действия над таблицей
 * @module editor/tables/components/spreadsheet-toolbar
 */

import { useState, useCallback } from 'react';
import { ALargeSmall, Hash, RefreshCw, Upload, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from './export-menu';
import { ImportDialog } from './import-dialog';
import { parseClipboardTsv } from '../utils/parse-clipboard';
import type { BotTable } from '../types';

/** Пропсы тулбара */
interface SpreadsheetToolbarProps {
  /** Текущая таблица для экспорта */
  table: BotTable;
  /** Добавить 26 буквенных колонок */
  onAddAlphabet: () => void;
  /** Добавить 100 строк */
  onAdd100Rows: () => void;
  /** Перезаписать ID строк */
  onReindex: () => void;
  /** Импорт как новая таблица */
  onImportNew: (name: string, columns: string[], rows: string[][]) => void;
  /** Импорт строк в текущую таблицу */
  onImportRows: (rows: string[][]) => void;
  /** Есть ли выбранная таблица */
  hasSelectedTable: boolean;
}

/**
 * Тулбар с быстрыми действиями для spreadsheet
 * @param props - Пропсы компонента
 * @returns JSX элемент тулбара
 */
export function SpreadsheetToolbar({
  table,
  onAddAlphabet,
  onAdd100Rows,
  onReindex,
  onImportNew,
  onImportRows,
  hasSelectedTable,
}: SpreadsheetToolbarProps) {
  /** Состояние диалога импорта */
  const [importOpen, setImportOpen] = useState(false);

  /** Вставка из буфера обмена через кнопку */
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const { columns, rows } = parseClipboardTsv(text);
      if (rows.length === 0) return;
      if (columns && columns.length > 0) {
        onImportNew('Из буфера', columns, rows);
      } else {
        onImportRows(rows);
      }
    } catch {
      /** Браузер заблокировал доступ к буферу — игнорируем */
    }
  }, [onImportNew, onImportRows]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50 bg-muted/20">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1.5"
        onClick={onAddAlphabet}
      >
        <ALargeSmall className="h-3.5 w-3.5" />
        + A-Z
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1.5"
        onClick={onAdd100Rows}
      >
        <Hash className="h-3.5 w-3.5" />
        + 1-100
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1.5"
        onClick={onReindex}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Перезаписать ID
      </Button>

      {/* Импорт, вставка и экспорт */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5"
          onClick={handlePasteFromClipboard}
          title="Вставить данные из буфера обмена"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Вставить
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
          Импорт
        </Button>
        <ExportMenu table={table} />
      </div>

      {/* Диалог импорта */}
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportNew={onImportNew}
        onImportRows={onImportRows}
        hasSelectedTable={hasSelectedTable}
      />
    </div>
  );
}
