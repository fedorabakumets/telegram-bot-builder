/**
 * @fileoverview Компонент управления пагинацией
 * @description Лаконичные кнопки переключения страниц
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Пропсы компонента PaginationControls
 */
interface PaginationControlsProps {
  /** Текущая страница */
  currentPage: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Перейти на страницу */
  goToPage: (page: number) => void;
  /** Предыдущая страница */
  prevPage: () => void;
  /** Следующая страница */
  nextPage: () => void;
}

/**
 * Компонент кнопок пагинации
 * @param props - Пропсы компонента
 * @returns JSX компонент пагинации
 */
export function PaginationControls({
  currentPage,
  totalPages,
  goToPage,
  prevPage,
  nextPage,
}: PaginationControlsProps): React.JSX.Element {
  if (totalPages <= 1) return <></>;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1 justify-center mt-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={prevPage}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>

      {pages.map(page => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'ghost'}
          size="sm"
          className="h-6 w-6 p-0 text-xs"
          onClick={() => goToPage(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={nextPage}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
