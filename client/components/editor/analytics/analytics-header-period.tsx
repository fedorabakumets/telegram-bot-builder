/** @fileoverview Компактный общий период в шапке аналитики с календарём и настройками во всплывающей панели. */
import './analytics-period-popover.css';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AnalyticsV2Range } from '@shared/analytics/v2';
import { AnalyticsReportControls } from './analytics-report-controls';
import { REPORT_PERIODS, type AnalyticsReportFilter } from './analytics-report-filter';
/** Свойства выбора общего периода. */
interface Props {
  /** Запрос открытия календаря из карточки. */ openRequest?:number;
  /** Текущие фильтры. */ filter: AnalyticsReportFilter;
  /** Границы актуального снимка; при загрузке старые даты не показываются. */ range?: AnalyticsV2Range;
  /** Применить изменение общего периода. */ onChange: (filter: AnalyticsReportFilter) => void;
}
/**
 * Сохраняет фильтры доступными при прокрутке, не занимая место большой панелью.
 * @param props - Период, актуальные границы и обработчик.
 * @returns Кнопка и доступная с клавиатуры панель фильтров.
 */
export function AnalyticsHeaderPeriod({ filter, range, onChange, openRequest=0 }: Props) {
  const [open,setOpen]=useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [boundary, setBoundary] = useState<HTMLElement | null>(null);
  /** Ограничивает раскрытую панель рабочей областью без боковой навигации. */
  function updateBoundary(open: boolean) {
    setOpen(open);
    if (open) setBoundary(trigger.current?.closest<HTMLElement>('.analytics-page') ?? null);
  }
  /** Открывает календарь по действию в графике, сохраняя одну общую форму. */
  useEffect(()=>{if(openRequest>0)updateBoundary(true);},[openRequest]);
  const format = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: filter.timezone, ...(filter.interval ? {hour:'2-digit',minute:'2-digit'} as const : {}) });
  const dates = range ? `${format.format(new Date(range.from))} — ${format.format(new Date(range.to))}` : '';
  return <Popover open={open} onOpenChange={updateBoundary}><PopoverTrigger asChild>
    <button ref={trigger} type="button" aria-label={`Период отчётов: ${REPORT_PERIODS[filter.period]}${dates ? `, ${dates}` : ''}`}
      className="flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background px-3 h-8 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" /><span>{REPORT_PERIODS[filter.period]}</span>
      {dates && <span className="text-muted-foreground truncate">{dates}</span>}<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  </PopoverTrigger><PopoverContent align="start" collisionBoundary={boundary} collisionPadding={16} style={{ maxWidth: 'var(--radix-popover-content-available-width)' }} className="analytics-page analytics-period-popover w-[min(420px,calc(100vw-32px))] max-h-[70vh] overflow-y-auto bg-background text-foreground border-border p-4">
    <AnalyticsReportControls filter={filter} onChange={onChange} />
  </PopoverContent></Popover>;
}
