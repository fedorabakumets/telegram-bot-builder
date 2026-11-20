/** @fileoverview Повторно используемые поля дополнительных фильтров в стиле существующей панели. */
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { AdvancedFilterPopover } from './advanced-filter-popover';
/**
 * Показывает подписанный выбор с общими токенами портального меню.
 * @param props - Значение, варианты и обработчик.
 * @returns Поле выбора.
 */
export function AdvancedChoice({ label, value, options, onChange, disabled, icon: Icon = SlidersHorizontal }: {
  /** Иконка назначения поля в той же позиции, что у основных фильтров. */ icon?: LucideIcon;
  /** Доступная подпись. */ label: string;
  /** Значение либо все варианты. */ value?: string;
  /** Пары значения и подписи. */ options: [string, string][];
  /** Установка выбранного значения. */ onChange: (value: string) => void;
  /** Недоступность в текущей области. */ disabled?: boolean;
}) {
  return <div className="min-w-0">
    <Select value={value || 'all'} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label}><div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><SelectValue placeholder={label} />
      </div></SelectTrigger>
      <SelectContent className="users-portal">{options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent>
    </Select></div>;
}
/**
 * Показывает подписанную пару границ без подмены пустого значения нулём.
 * @param props - Подписи, границы и обработчики.
 * @returns Два компактных поля диапазона.
 */
export function AdvancedRange({ label, type = 'number', min, max, onMin, onMax, icon: Icon = SlidersHorizontal }: {
  /** Иконка общего диапазона. */ icon?: LucideIcon;
  /** Название диапазона. */ label: string;
  /** Тип значений. */ type?: 'number' | 'date';
  /** Нижняя граница. */ min?: string;
  /** Верхняя граница. */ max?: string;
  /** Изменение нижней границы. */ onMin: (value: string) => void;
  /** Изменение верхней границы. */ onMax: (value: string) => void;
}) {
  const summary = min !== undefined || max !== undefined ? `${label}: ${min || '…'} — ${max || '…'}` : undefined;
  return <AdvancedFilterPopover icon={Icon} label={label} summary={summary} width={type === 'date' ? 384 : 320}>
    <div className="users-range-grid grid grid-cols-2 gap-3" data-date={type === 'date'}>
      <label className="min-w-0 space-y-1.5 text-xs text-muted-foreground"><span>От</span>
        <Input className="w-full text-foreground" aria-label={`${label}: от`} placeholder="От" type={type} min={type === 'number' ? 0 : undefined} step={1} value={min ?? ''} onChange={e => onMin(e.target.value)} /></label>
      <label className="min-w-0 space-y-1.5 text-xs text-muted-foreground"><span>До</span>
        <Input className="w-full text-foreground" aria-label={`${label}: до`} placeholder="До" type={type} min={type === 'number' ? 0 : undefined} step={1} value={max ?? ''} onChange={e => onMax(e.target.value)} /></label>
    </div><p className="text-xs leading-4 text-muted-foreground">Границы включены. Пустое поле не ограничивает диапазон.</p></AdvancedFilterPopover>;
}
