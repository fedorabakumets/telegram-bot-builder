/**
 * @fileoverview Раскрывающаяся подсказка «Что это за график?» для карточки графика по таблице
 * @module editor/analytics/table-chart/table-chart-info
 */

import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

/**
 * Спойлер с пояснением о назначении графика по таблице:
 * на основе чего он строится, как работают оси, агрегации и типы графика.
 * @returns JSX элемент спойлера
 */
export function TableChartInfo(): React.JSX.Element {
  /** Открыт ли спойлер с пояснением */
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-muted-foreground transition-colors"
        data-testid="table-chart-info-trigger"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        Что это за график?
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1.5">
        <div className="text-[11px] leading-relaxed text-muted-foreground/80 space-y-1.5">
          <p>
            График строится на основе ваших <b>пользовательских таблиц</b> проекта —
            тех, что вы создаёте во вкладке «Таблицы». Вы сами выбираете, какие
            данные и как показать.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <b>Категория (X)</b> — колонка, по значениям которой группируются строки.
            </li>
            <li>
              <b>Значение (Y)</b> — колонка, числа из которой агрегируются внутри группы.
            </li>
            <li>
              <b>Агрегации:</b> «Количество» (число строк в группе), «Сумма», «Среднее»,
              «Минимум», «Максимум» — для числовой колонки. Для нечисловой колонки
              доступно только «Количество».
            </li>
            <li>
              <b>Типы графика:</b> «Столбцы», «Линия», «Круговая».
            </li>
          </ul>
          <p className="text-muted-foreground/60">
            Показываются топ-50 категорий, данные обновляются автоматически.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
