/**
 * @fileoverview Общий спойлер «Что это за график?» для карточек аналитики
 * @module client/components/editor/analytics/chart-info-spoiler
 */

import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

/**
 * Пропсы спойлера с пояснением графика
 */
export interface ChartInfoSpoilerProps {
  /** Текст или разметка пояснения */
  children: React.ReactNode;
  /** Подпись кнопки (по умолчанию «Что это за график?») */
  label?: string;
}

/**
 * Показывает доступную с клавиатуры подсказку с читаемым текстом и отдельной областью пояснения.
 * @param props - Пропсы компонента
 * @returns JSX элемент спойлера
 */
export function ChartInfoSpoiler({
  children,
  label = 'Что это за график?',
}: ChartInfoSpoilerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="analytics-chart-info rounded-lg border border-border">
      <CollapsibleTrigger
        className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:opacity-80 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <span className="flex-1">{label}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 px-3 pb-4 pt-2 text-pretty text-sm text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:space-y-2 [&_ul]:pl-4 [&_ul]:list-disc">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
