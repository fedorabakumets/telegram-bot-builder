/**
 * @fileoverview Компонент счёта ответов
 * @description Отображает диапазон показанных ответов и общее количество
 */

import { Badge } from '@/components/ui/badge';
import type { ResponseCountProps } from '../types';

/**
 * Компонент счёта ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент счёта
 */
export function ResponseCount({
  currentPage,
  itemsPerPage,
  totalCount,
}: Omit<ResponseCountProps, 'totalPages'>): React.JSX.Element {
  if (totalCount === 0) return <></>;
  
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <Badge variant="secondary" className="text-[9px] xs:text-[10px] sm:text-xs flex-shrink-0 px-1 xs:px-1.5 sm:px-2 py-0">
      {start}–{end} из {totalCount}
    </Badge>
  );
}
