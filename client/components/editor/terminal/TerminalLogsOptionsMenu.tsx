/**
 * @fileoverview Меню «Опции» панели логов (zoom, clear, export, close)
 * @module terminal/TerminalLogsOptionsMenu
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  Trash2,
  X,
} from 'lucide-react';
import type { LogFilter } from './useTerminalFilter';
import type { ExportFormat } from './terminalUtils';

/** Пропсы меню опций логов */
interface TerminalLogsOptionsMenuProps {
  /** Текущий фильтр */
  filter: LogFilter;
  /** Смена фильтра */
  onFilterChange: (f: LogFilter) => void;
  /** Zoom + */
  onZoomIn?: () => void;
  /** Zoom − */
  onZoomOut?: () => void;
  /** Очистить */
  onClear?: () => void;
  /** Копировать */
  onCopy?: (format: ExportFormat) => void;
  /** Скачать */
  onSave?: (format: ExportFormat) => void;
  /** Закрыть */
  onClose?: () => void;
}

/** Пункты фильтра в меню */
const FILTERS: Array<{ label: string; value: LogFilter }> = [
  { label: 'Все', value: 'all' },
  { label: 'Вывод', value: 'stdout' },
  { label: 'Ошибки', value: 'stderr' },
];

/**
 * Кнопка Options с действиями над логом
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogsOptionsMenu({
  filter,
  onFilterChange,
  onZoomIn,
  onZoomOut,
  onClear,
  onCopy,
  onSave,
  onClose,
}: TerminalLogsOptionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Опции</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Фильтр</DropdownMenuLabel>
        {FILTERS.map(({ label, value }) => (
          <DropdownMenuItem key={value} onClick={() => onFilterChange(value)}>
            {label}{filter === value ? ' ✓' : ''}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {onZoomIn && (
          <DropdownMenuItem onClick={onZoomIn}>
            <ZoomIn className="mr-2 h-3.5 w-3.5" />Увеличить
          </DropdownMenuItem>
        )}
        {onZoomOut && (
          <DropdownMenuItem onClick={onZoomOut}>
            <ZoomOut className="mr-2 h-3.5 w-3.5" />Уменьшить
          </DropdownMenuItem>
        )}
        {onClear && (
          <DropdownMenuItem onClick={onClear}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />Очистить
          </DropdownMenuItem>
        )}
        {onCopy && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Копировать</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onCopy('text')}>Текст</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy('json')}>JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy('csv')}>CSV</DropdownMenuItem>
          </>
        )}
        {onSave && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Скачать</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onSave('text')}>Текст</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSave('json')}>JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSave('csv')}>CSV</DropdownMenuItem>
          </>
        )}
        {onClose && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClose}>
              <X className="mr-2 h-3.5 w-3.5" />Закрыть
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
