/**
 * @fileoverview Выбор периода логов и формы локальных дат начала и окончания.
 */
import { useRef, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { LOG_PERIOD_OPTIONS, parseCustomLogRange, type LogPeriod, type LogPeriodRange } from './terminal-log-period';

/** Свойства выбора периода. */
interface TerminalPeriodPickerProps {
  /** Выбранный период */
  period: LogPeriod;
  /** Активный диапазон */
  range: LogPeriodRange | null;
  /** Смена стандартного периода */
  onChange: (period: LogPeriod) => void;
  /** Применение произвольных дат */
  onCustomRange: (range: LogPeriodRange) => void;
}

/**
 * Преобразует абсолютную дату в значение локального поля даты и времени.
 * @param value - Абсолютная дата
 * @returns Значение поля даты
 */
function localInputValue(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Показывает компактный селектор и форму произвольного диапазона.
 * @param props - Выбранный период и обработчики
 * @returns Панель выбора времени
 */
export function TerminalPeriodPicker({ period, range, onChange, onCustomRange }: TerminalPeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const pendingCustom = useRef(false);
  const custom = parseCustomLogRange(from, to);
  /**
   * Открывает форму с текущим диапазоном или последним часом для живых логов.
   * @returns Ничего не возвращает
   */
  function openCustom() {
    const end = new Date();
    setFrom(localInputValue(range?.from ?? new Date(end.getTime() - 3600000).toISOString()));
    setTo(localInputValue(range?.to ?? end.toISOString()));
    setOpen(true);
  }
  return (
    <div className="flex shrink-0 items-center gap-1 font-sans">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="Период логов" className="h-8 w-[170px] justify-between px-3 text-xs">
            {LOG_PERIOD_OPTIONS.find(option => option.value === period)?.label}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={event => {
          if (pendingCustom.current) {
            event.preventDefault();
            pendingCustom.current = false;
            openCustom();
          }
        }}>
          <DropdownMenuRadioGroup value={period} onValueChange={value => onChange(value as LogPeriod)}>
            {LOG_PERIOD_OPTIONS.filter(option => option.value !== 'custom').map(option => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>{option.label}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuItem className="pl-8" onSelect={() => { pendingCustom.current = true; }}>
            Свой период…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={open} onOpenChange={value => {
        if (value) openCustom();
        else setOpen(false);
      }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Настроить период">
            <CalendarDays className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-3 font-sans">
          <p className="text-sm font-medium">Свой период</p>
          <label className="block space-y-1 text-xs">От
            <Input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs">До
            <Input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">Часовой пояс: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          {from && to && !custom && <p role="alert" className="text-xs text-destructive">Окончание должно быть позже начала.</p>}
          <Button className="w-full" disabled={!custom} onClick={() => {
            if (custom) { onCustomRange(custom); setOpen(false); }
          }}>Применить</Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
