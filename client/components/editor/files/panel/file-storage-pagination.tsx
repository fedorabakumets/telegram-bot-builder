/**
 * @fileoverview Пагинация списка файлов в панели хранилища.
 * @module components/editor/files/panel/file-storage-pagination
 */

import { Button } from '@/components/ui/button';

/** Пропсы пагинации списка файлов */
export interface FileStoragePaginationProps {
  /** Текущая страница (с 1) */
  page: number;
  /** Всего страниц */
  totalPages: number;
  /** Всего файлов */
  total: number;
  /** Смена страницы */
  onPageChange: (next: number) => void;
}

/**
 * Строка пагинации: счётчик и кнопки «Назад» / «Вперёд».
 * @param props - Страница, totals и колбэк смены
 * @returns JSX пагинации или null
 */
export function FileStoragePagination({
  page,
  totalPages,
  total,
  onPageChange,
}: FileStoragePaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
      <span>{total} файлов • стр. {page}/{totalPages}</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Назад
        </Button>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Вперёд
        </Button>
      </div>
    </div>
  );
}
