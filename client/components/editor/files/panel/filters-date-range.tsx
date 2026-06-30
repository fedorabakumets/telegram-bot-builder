/**
 * @fileoverview Выделенный виджет выбора диапазона дат «от-до» `FiltersDateRange`
 * (Req 6.3). Полированная замена временного `filters-modal-date-field`: shadcn
 * Calendar (mode="range") в Popover с подписью выбранного диапазона и кнопкой
 * быстрой очистки. Контракт пропсов совместим с прежним полем, чтобы подмена в
 * `filters-modal-fields` была минимальной. Иконки lucide-react, без эмодзи (Req 13.2).
 * @module components/editor/files/panel/filters-date-range
 */

import { CalendarDays, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** Пропсы виджета диапазона дат */
export interface FiltersDateRangeProps {
  /** Начало диапазона (ISO-строка) */
  dateFrom?: string;
  /** Конец диапазона (ISO-строка) */
  dateTo?: string;
  /** Изменение диапазона (ISO-строки либо undefined для сброса) */
  onChange: (from?: string, to?: string) => void;
}

/**
 * Преобразует ISO-строку в Date либо undefined.
 * @param iso - ISO-строка даты
 * @returns Объект Date или undefined
 */
function toDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Форматирует диапазон дат в подпись кнопки-триггера.
 * @param from - Начало диапазона
 * @param to - Конец диапазона
 * @returns Подпись с выбранными датами или приглашение
 */
function rangeLabel(from?: Date, to?: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU');
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return `с ${fmt(from)}`;
  if (to) return `по ${fmt(to)}`;
  return 'Выбрать дату вручную';
}

/**
 * Виджет выбора диапазона дат загрузки файлов (Req 6.3).
 * @param props - Текущий диапазон и обработчик изменения
 * @returns JSX элемент поля диапазона дат
 */
export function FiltersDateRange({ dateFrom, dateTo, onChange }: FiltersDateRangeProps) {
  const from = toDate(dateFrom);
  const to = toDate(dateTo);
  const hasValue = Boolean(from || to);

  /** Обработка выбора диапазона в календаре */
  const handleSelect = (range: DateRange | undefined) => {
    onChange(range?.from?.toISOString(), range?.to?.toISOString());
  };

  /** Сброс выбранного диапазона */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Дата загрузки</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start font-normal"
              data-testid="filters-date-trigger"
            >
              <CalendarDays className="mr-2 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{rangeLabel(from, to)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={{ from, to }} onSelect={handleSelect} numberOfMonths={1} />
          </PopoverContent>
        </Popover>
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleClear}
            aria-label="Очистить даты"
            data-testid="filters-date-clear"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
