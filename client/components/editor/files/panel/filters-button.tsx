/**
 * @fileoverview Кнопка открытия модалки фильтров `FiltersButton` (Req 6.1).
 * Расположена над таблицей; по клику вызывает onOpen (в панели —
 * s.setFiltersOpen(true)). При наличии применённых фильтров показывает бейдж
 * с их количеством. Сама модалка фильтров (`FiltersModal`) реализуется в
 * задаче 6.2 — здесь только кнопка-триггер. Использует shadcn/ui Button/Badge
 * и смысловую иконку lucide-react (без декоративных эмодзи, Req 13.2).
 * @module components/editor/files/panel/filters-button
 */

import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/** Пропсы кнопки фильтров */
export interface FiltersButtonProps {
  /** Количество применённых фильтров (0 = бейдж скрыт) */
  activeCount: number;
  /** Открыть модалку фильтров */
  onOpen: () => void;
}

/**
 * Кнопка над таблицей, открывающая модалку фильтров (Req 6.1).
 * @param props - Количество активных фильтров и обработчик открытия
 * @returns JSX элемент кнопки фильтров
 */
export function FiltersButton({ activeCount, onOpen }: FiltersButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onOpen}
      data-testid="filters-button"
    >
      <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
      Фильтры
      {activeCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-1.5 h-5 min-w-5 justify-center px-1.5 tabular-nums"
          data-testid="filters-active-count"
        >
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}
