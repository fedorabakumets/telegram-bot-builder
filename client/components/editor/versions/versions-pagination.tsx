/** @fileoverview Закреплённая навигация истории версий в стиле списка файлов. */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePageSize } from '../files/panel/file-page-size';
import './versions-pagination.css';

/** Свойства навигации по истории. */
interface VersionsPaginationProps {
  /** Номер страницы начиная с единицы. */
  page: number;
  /** Число записей на странице. */
  pageSize: number;
  /** Всего сохранённых версий. */
  total: number;
  /** Доступна следующая страница по курсору сервера. */
  hasNextPage: boolean;
  /** Выполняется запрос текущей страницы. */
  isFetching?: boolean;
  /** Переключение страницы. */
  onPageChange: (page: number) => void;
  /** Изменение числа записей. */
  onPageSizeChange: (size: number) => void;
}

/**
 * Показывает размер страницы слева, страницы в центре и диапазон справа.
 * @param props - Размер выборки, счётчики и обработчики
 * @returns Нижняя панель навигации
 */
export function VersionsPagination({ page, pageSize, total, hasNextPage, isFetching, onPageChange, onPageSizeChange }: VersionsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <nav aria-label="Навигация по версиям" className="versions-pagination">
    <FilePageSize ariaLabel="Версий на странице" value={pageSize} onChange={onPageSizeChange} />
    <div className="versions-pagination-controls flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" disabled={page <= 1 || isFetching}
        onClick={() => onPageChange(page - 1)} aria-label="Предыдущая страница версий"><ChevronLeft className="h-4 w-4" /></Button>
      <span className="whitespace-nowrap text-sm tabular-nums">{page} / {totalPages}</span>
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" disabled={!hasNextPage || isFetching}
        onClick={() => onPageChange(page + 1)} aria-label="Следующая страница версий"><ChevronRight className="h-4 w-4" /></Button>
    </div>
    <span className="versions-pagination-range text-xs text-muted-foreground">{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} из ${total.toLocaleString('ru-RU')}` : '0 версий'}</span>
  </nav>;
}
