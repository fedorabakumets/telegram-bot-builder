/**
 * @fileoverview Панель фильтрации и управления терминалом
 *
 * Слева: кнопки фильтра (Все / Вывод / Ошибки).
 * Справа: кнопки управления (zoom, очистка, копирование, скачивание).
 *
 * @module TerminalFilterBar
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ZoomIn, ZoomOut, Trash2, Copy, Download } from 'lucide-react';
import { LogFilter } from './useTerminalFilter';
import type { ExportFormat } from './terminalUtils';

/** Пропсы компонента панели фильтрации */
interface TerminalFilterBarProps {
  /** Текущий активный фильтр */
  filter: LogFilter;
  /** Обработчик смены фильтра */
  onFilterChange: (f: LogFilter) => void;
  /** Количество строк stderr для бейджа */
  stderrCount: number;
  /** Увеличить масштаб */
  onZoomIn?: () => void;
  /** Уменьшить масштаб */
  onZoomOut?: () => void;
  /** Очистить терминал */
  onClear?: () => void;
  /** Копировать в формате */
  onCopy?: (format: ExportFormat) => void;
  /** Сохранить в формате */
  onSave?: (format: ExportFormat) => void;
}

/** Конфигурация кнопок фильтра */
const FILTER_BUTTONS: { label: string; value: LogFilter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Вывод', value: 'stdout' },
  { label: 'Ошибки', value: 'stderr' },
];

/**
 * Панель фильтрации и управления терминалом
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalFilterBar({
  filter, onFilterChange, stderrCount,
  onZoomIn, onZoomOut, onClear, onCopy, onSave,
}: TerminalFilterBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30">
      {/* Фильтры слева */}
      <div className="flex items-center gap-1">
        {FILTER_BUTTONS.map(({ label, value }) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => onFilterChange(value)}
          >
            {label}
            {value === 'stderr' && stderrCount > 0 && (
              <Badge
                variant="destructive"
                className="h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {stderrCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Кнопки управления справа */}
      <div className="flex items-center gap-0.5">
        {onZoomIn && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onZoomIn} title="Увеличить">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        )}
        {onZoomOut && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onZoomOut} title="Уменьшить">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        )}
        {onClear && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear} title="Очистить">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {onCopy && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Копировать">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Копировать</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onCopy('text')}>Текст</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy('json')}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onSave && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Скачать">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Скачать</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onSave('text')}>Текст</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSave('json')}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSave('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
