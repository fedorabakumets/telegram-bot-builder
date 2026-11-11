/**
 * @fileoverview Компонент счёта ответов
 * @description Отображает диапазон показанных ответов и общее количество
 */


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
}: ResponseCountProps): React.JSX.Element {
  if (totalCount === 0) return <></>;
  
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {start}–{end} из {totalCount}
    </span>
  );
}
