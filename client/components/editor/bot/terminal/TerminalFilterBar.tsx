/**
 * @fileoverview Панель фильтрации строк терминала по типу вывода
 * @module TerminalFilterBar
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogFilter } from './useTerminalFilter';

/** Пропсы компонента панели фильтрации */
interface TerminalFilterBarProps {
  /** Текущий активный фильтр */
  filter: LogFilter;
  /** Обработчик смены фильтра */
  onFilterChange: (f: LogFilter) => void;
  /** Количество строк stderr для бейджа */
  stderrCount: number;
}

/** Конфигурация кнопок фильтра */
const FILTER_BUTTONS: { label: string; value: LogFilter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Вывод', value: 'stdout' },
  { label: 'Ошибки', value: 'stderr' },
];

/**
 * Панель с кнопками-тогглами для фильтрации строк терминала
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalFilterBar({ filter, onFilterChange, stderrCount }: TerminalFilterBarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-border bg-muted/30">
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
  );
}
