/**
 * @fileoverview Тулбар spreadsheet — быстрые действия над таблицей
 * @module editor/tables/components/spreadsheet-toolbar
 */

import { ALargeSmall, Hash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Пропсы тулбара */
interface SpreadsheetToolbarProps {
  /** Добавить 26 буквенных колонок */
  onAddAlphabet: () => void;
  /** Добавить 100 строк */
  onAdd100Rows: () => void;
  /** Перезаписать ID строк */
  onReindex: () => void;
}

/**
 * Тулбар с быстрыми действиями для spreadsheet
 * @param props - Пропсы компонента
 * @returns JSX элемент тулбара
 */
export function SpreadsheetToolbar({ onAddAlphabet, onAdd100Rows, onReindex }: SpreadsheetToolbarProps) {
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
    </div>
  );
}
