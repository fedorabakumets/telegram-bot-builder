/**
 * @fileoverview Dropdown переключатель таблиц в шапке редактора
 * @module editor/tables/components/table-switcher
 */

import { ChevronDown, Table2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import type { BotTable } from '../types';

/** Пропсы переключателя таблиц */
interface TableSwitcherProps {
  /** Список всех таблиц */
  tables: BotTable[];
  /** Текущая выбранная таблица */
  selectedTable: BotTable | null;
  /** Обработчик выбора таблицы */
  onSelect: (tableId: string) => void;
}

/**
 * Dropdown для быстрого переключения между таблицами
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function TableSwitcher({ tables, selectedTable, onSelect }: TableSwitcherProps) {
  if (tables.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-medium">
          <Table2 className="h-3.5 w-3.5" />
          {selectedTable?.name ?? 'Выбрать таблицу'}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {tables.map((table) => (
          <DropdownMenuItem
            key={table.id}
            className={cn(
              selectedTable?.id === table.id && 'bg-primary/10 text-primary'
            )}
            onClick={() => onSelect(table.id)}
          >
            <Table2 className="h-3.5 w-3.5 mr-2" />
            <span className="truncate">{table.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
