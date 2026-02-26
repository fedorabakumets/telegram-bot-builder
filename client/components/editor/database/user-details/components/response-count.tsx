/**
 * @fileoverview Компонент счёта ответов
 * @description Отображает диапазон показанных ответов и общее количество
 */

import { Badge } from '@/components/ui/badge';

/**
 * Пропсы компонента ResponseCount
 */
interface ResponseCountProps {
  /** Текущая страница */
  currentPage: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Количество элементов на странице */
  itemsPerPage: number;
  /** Общее количество ответов */
  totalCount: number;
}

/**
 * Компонент счёта ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент счёта
 */
export function ResponseCount({
  currentPage,
  totalPages,
  itemsPerPage,
  totalCount,
}: ResponseCountProps): React.JSX.Element {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <Badge variant="secondary" className="text-[9px] xs:text-[10px] sm:text-xs flex-shrink-0 px-1 xs:px-1.5 sm:px-2 py-0">
      {start}–{end} из {totalCount}
    </Badge>
  );
}
