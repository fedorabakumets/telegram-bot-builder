/**
 * @fileoverview Кнопка открытия модалки фильтров `FiltersButton` (Req 6.1).
 * Расположена над таблицей; по клику вызывает onOpen (в панели —
 * s.setFiltersOpen(true)). При наличии применённых фильтров показывает
 * primary-пилюлю с их количеством. Сама модалка фильтров реализуется в
 * задаче 6.2 — здесь только кнопка-триггер. Использует shadcn/ui Button и
 * смысловую иконку lucide-react (без декоративных эмодзи, Req 13.2).
 * Высота `h-8` синхронизирована с кнопками шапки панели (Req 13.1).
 * @module components/editor/files/panel/filters-button
 */

import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  FILTERS_BUTTON_CLASS,
  FILTERS_BUTTON_COUNT_BADGE_CLASS,
} from './panel-styles';

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
      className={FILTERS_BUTTON_CLASS}
      onClick={onOpen}
      data-testid="filters-button"
    >
      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
      Фильтры
      {activeCount > 0 && (
        <span
          className={FILTERS_BUTTON_COUNT_BADGE_CLASS}
          data-testid="filters-active-count"
        >
          {activeCount}
        </span>
      )}
    </Button>
  );
}
