/**
 * @fileoverview Хук для пагинации ответов пользователя
 * @description Управление страницами ответов с ограничением на страницу
 */

import { useState, useMemo } from 'react';

/**
 * Параметры хука useResponsePagination
 */
interface UseResponsePaginationParams {
  /** Массив записей ответов */
  entries: [string, unknown][];
  /** Количество элементов на странице */
  itemsPerPage?: number;
}

/**
 * Результат хука useResponsePagination
 */
interface UseResponsePaginationReturn {
  /** Текущая страница */
  currentPage: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Показанные элементы */
  visibleEntries: [string, unknown][];
  /** Перейти на страницу */
  goToPage: (page: number) => void;
  /** Следующая страница */
  nextPage: () => void;
  /** Предыдущая страница */
  prevPage: () => void;
}

/**
 * Хук для пагинации ответов
 * @param params - Параметры хука
 * @returns Объект с данными пагинации
 */
export function useResponsePagination(params: UseResponsePaginationParams): UseResponsePaginationReturn {
  const { entries, itemsPerPage = 12 } = params;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(entries.length / itemsPerPage), [entries.length, itemsPerPage]);

  const visibleEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return entries.slice(start, start + itemsPerPage);
  }, [entries, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return {
    currentPage,
    totalPages,
    visibleEntries,
    goToPage,
    nextPage,
    prevPage,
  };
}
