/**
 * @fileoverview Хук для управления адаптивностью панели
 * @description Объединяет данные о размерах и предоставляет методы для адаптивного отображения
 */

import { usePanelDimensions } from './use-panel-dimensions';
import { getBreakpoint, getVisibleColumns, getStatsGridColumns, Breakpoint } from '../utils/responsive-utils';

/**
 * Результат работы хука адаптивности
 */
interface UseResponsiveReturn {
  /** Ref для привязки к контейнеру панели */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Текущая ширина панели */
  width: number;
  /** Текущая высота панели */
  height: number;
  /** Текущий брейкпоинт */
  breakpoint: Breakpoint;
  /** Количество видимых колонок таблицы */
  visibleColumns: number;
  /** Количество колонок сетки статистики */
  statsColumns: number;
  /** Флаг: очень маленький экран (xs) */
  isExtraSmall: boolean;
  /** Флаг: маленький экран (sm) */
  isSmall: boolean;
  /** Флаг: средний экран (md) */
  isMedium: boolean;
  /** Флаг: большой экран (lg) */
  isLarge: boolean;
  /** Флаг: очень большой экран (xl) */
  isExtraLarge: boolean;
}

/**
 * Хук для управления адаптивностью панели
 * @returns Объект с данными и методами адаптивности
 */
export function useResponsive(): UseResponsiveReturn {
  const { width, height, ref } = usePanelDimensions();
  const breakpoint = getBreakpoint(width);

  return {
    containerRef: ref,
    width,
    height,
    breakpoint,
    visibleColumns: getVisibleColumns(width),
    statsColumns: getStatsGridColumns(width),
    isExtraSmall: breakpoint === 'xs',
    isSmall: breakpoint === 'sm',
    isMedium: breakpoint === 'md',
    isLarge: breakpoint === 'lg',
    isExtraLarge: breakpoint === 'xl',
  };
}
