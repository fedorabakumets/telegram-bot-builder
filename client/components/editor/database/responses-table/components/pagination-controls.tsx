/**
 * @fileoverview Доступная компактная навигация по страницам ответов.
 */
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationControlsProps } from '../types';

/**
 * Показывает текущую страницу, соседние страницы и края диапазона.
 * @param props - Состояние страницы и обработчики переходов.
 * @returns Навигация по ответам или пустой элемент.
 */
export function PaginationControls({ currentPage, totalPages, goToPage, prevPage, nextPage }: PaginationControlsProps): React.JSX.Element {
  if (totalPages <= 1) return <></>;
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  return (
    <nav aria-label="Страницы ответов" className="flex flex-wrap items-center justify-center gap-1 pt-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Предыдущая страница" onClick={prevPage} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      {pages.map((page, index) => (
        <span key={page} className="flex items-center gap-1">
          {index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>}
          <Button variant={currentPage === page ? 'secondary' : 'ghost'} size="sm" className="h-8 min-w-8 px-2 text-xs tabular-nums"
            aria-label={`Страница ${page}`} aria-current={currentPage === page ? 'page' : undefined} onClick={() => goToPage(page)}>{page}</Button>
        </span>
      ))}
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Следующая страница" onClick={nextPage} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
