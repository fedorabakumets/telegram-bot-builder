/**
 * @fileoverview Компонент пагинации для списка рассылок
 * @module client/components/editor/broadcast/components/broadcast-pagination
 */

import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from '@/components/ui/pagination';

/**
 * Пропсы компонента BroadcastPagination
 */
interface BroadcastPaginationProps {
  /** Текущая страница */
  page: number;
  /** Всего страниц */
  totalPages: number;
  /** Обработчик смены страницы */
  onPageChange: (page: number) => void;
}

/**
 * Генерирует массив номеров страниц с многоточием.
 * @param current - Текущая страница
 * @param total - Всего страниц
 * @returns Массив номеров или null (многоточие)
 */
function buildPages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | null)[] = [1];
  if (current > 3) pages.push(null);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push(null);
  pages.push(total);
  return pages;
}

/**
 * Стилизованная пагинация с номерами страниц и многоточием.
 * @param props - Свойства компонента
 * @returns JSX элемент пагинации
 */
export function BroadcastPagination({ page, totalPages, onPageChange }: BroadcastPaginationProps) {
  const pages = buildPages(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === null ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => onPageChange(p)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
