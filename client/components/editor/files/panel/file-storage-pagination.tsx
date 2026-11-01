/** @fileoverview Обычная пагинация под списком с выбором количества файлов. */
import { FilePageSize } from './file-page-size';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './file-storage-pagination.css';

/** Параметры пагинации файлов. */
export interface FileStoragePaginationProps {
  /** Текущая страница. */
  page: number;
  /** Число страниц. */
  totalPages: number;
  /** Общее число файлов. */
  total: number;
  /** Изменение страницы. */
  onPageChange: (next: number) => void;
  /** Количество файлов на странице. */
  pageSize: number;
  /** Изменение количества файлов. */
  onPageSizeChange: (size: number) => void;
}

/**
 * Отображает размер страницы и переходы в обычном потоке под файлами.
 * @param props - Текущая выборка и обработчики
 * @returns Панель пагинации либо отсутствие элемента для пустой выборки
 */
export function FileStoragePagination({ page, totalPages, total, onPageChange, pageSize, onPageSizeChange }: FileStoragePaginationProps) {
  const root = useRef<HTMLElement>(null);
  /** Возвращает к началу файлов после изменения страницы или её размера. */
  const toList = () => {
    const panel = root.current?.closest('.files-page');
    const list = panel?.querySelector('[data-testid="files-table-slot"]');
    if (panel && list) panel.scrollTo({ top: panel.scrollTop + list.getBoundingClientRect().top - panel.getBoundingClientRect().top - 16, behavior: 'instant' });
  };
  /** Пустая выборка не требует переходов и выбора размера страницы. */
  if (total <= 0) return null;
  return <nav ref={root} aria-label="Навигация по файлам" className="files-list-navigation">
    <FilePageSize value={pageSize} onChange={size => { onPageSizeChange(size); toList(); }} />
    <span className="files-pagination-range text-sm text-muted-foreground">{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} из ${total.toLocaleString('ru-RU')}` : '0 файлов'}</span>
    <div className="files-pagination-pages flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-10 w-10" disabled={page <= 1} onClick={() => { onPageChange(page - 1); toList(); }} aria-label="Предыдущая страница файлов"><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm tabular-nums">{page} / {Math.max(1, totalPages)}</span>
      <Button variant="outline" size="icon" className="h-10 w-10" disabled={page >= totalPages} onClick={() => { onPageChange(page + 1); toList(); }} aria-label="Следующая страница файлов"><ChevronRight className="h-4 w-4" /></Button>
    </div>
  </nav>;
}
