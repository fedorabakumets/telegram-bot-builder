/** @fileoverview Компактный селектор дополнительных условий в стиле основных фильтров. */
import type { ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
/**
 * Раскрывает редактирование диапазона внутри обычного выпадающего меню.
 * @param props - Иконка, подпись, текущее условие и поля меню.
 * @returns Компактный селектор без отдельного окна.
 */
export function AdvancedFilterPopover({ icon: Icon, label, summary, children, width = 320, onOpenChange }: {
  /** Уведомление об открытии для загрузки содержимого только при необходимости. */ onOpenChange?: (open: boolean) => void;
  /** Ширина меню; даты получают место для полного значения и календаря. */ width?: number;
  /** Иконка фильтра. */ icon: LucideIcon;
  /** Доступная подпись. */ label: string;
  /** Выбранное ограничение. */ summary?: string;
  /** Поля выпадающего меню. */ children: ReactNode;
}) {
  return <Popover onOpenChange={onOpenChange}><PopoverTrigger asChild>
    <button type="button" aria-label={label} className="users-advanced-selector flex h-10 w-full min-w-0 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm">
      <span className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{summary || label}</span></span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  </PopoverTrigger><PopoverContent align="start" style={{ width }} className="users-portal users-advanced-menu max-w-[calc(100vw-32px)] space-y-3 rounded-lg border-border p-3">
    <p className="text-sm font-medium">{label}</p>{children}
  </PopoverContent></Popover>;
}
