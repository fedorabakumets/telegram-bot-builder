/**
 * @fileoverview Единая панель логов в стиле Railway (поиск + фильтр + Options)
 * @module terminal/TerminalLogsToolbar
 */

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { TerminalLogsOptionsMenu } from './TerminalLogsOptionsMenu';
import type { LogFilter } from './useTerminalFilter';
import type { ExportFormat } from './terminalUtils';

/** Пропсы Railway-style панели логов */
export interface TerminalLogsToolbarProps {
  /** Поисковый запрос */
  searchQuery: string;
  /** Смена запроса */
  onSearchChange: (query: string) => void;
  /** Индекс совпадения */
  currentMatch: number;
  /** Всего совпадений */
  totalMatches: number;
  /** Следующее совпадение */
  onNext: () => void;
  /** Предыдущее совпадение */
  onPrev: () => void;
  /** Фильтр потока */
  filter: LogFilter;
  /** Смена фильтра */
  onFilterChange: (f: LogFilter) => void;
  /** Число ошибок */
  stderrCount: number;
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
  /** Закрыть (история запуска) */
  onClose?: () => void;
}

/** Кнопки фильтра потока */
const FILTERS: Array<{ label: string; value: LogFilter }> = [
  { label: 'Все', value: 'all' },
  { label: 'Вывод', value: 'stdout' },
  { label: 'Ошибки', value: 'stderr' },
];

/**
 * Одна строка: поиск слева, фильтры и Options справа (как у Railway)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogsToolbar(props: TerminalLogsToolbarProps) {
  const {
    searchQuery, onSearchChange, currentMatch, totalMatches, onNext, onPrev,
    filter, onFilterChange, stderrCount,
    onZoomIn, onZoomOut, onClear, onCopy, onSave, onClose,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) onPrev();
    else if (e.key === 'Enter') onNext();
  };

  return (
    <div className="flex h-10 items-center gap-2 px-4 border-b border-border bg-background shrink-0">
      <div className="flex flex-1 min-w-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/20 px-2 h-8">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Фильтр и поиск логов"
          className="h-7 text-xs flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        {searchQuery && (
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : '0/0'}
          </span>
        )}
        {searchQuery && (
          <>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onPrev} disabled={totalMatches === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onNext} disabled={totalMatches === 0}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-0.5 shrink-0">
        {FILTERS.map(({ label, value }) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={() => onFilterChange(value)}
          >
            {label}
            {value === 'stderr' && stderrCount > 0 && (
              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] leading-none">
                {stderrCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <TerminalLogsOptionsMenu
        filter={filter}
        onFilterChange={onFilterChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onClear={onClear}
        onCopy={onCopy}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
}
