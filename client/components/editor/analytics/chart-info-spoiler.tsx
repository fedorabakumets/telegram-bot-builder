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
 * Раскрывающаяся подсказка о назначении графика
 * @param props - Пропсы компонента
 * @returns JSX элемент спойлера
 */
export function ChartInfoSpoiler({
  children,
  label = 'Что это за график?',
}: ChartInfoSpoilerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-muted-foreground transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1.5">
        <div className="text-[11px] leading-relaxed text-muted-foreground/80 space-y-1.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
