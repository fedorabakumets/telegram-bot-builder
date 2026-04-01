/**
 * @fileoverview Хук управления состоянием поиска по листам
 * @module components/editor/sidebar/hooks/use-sheet-search-state
 */

import { useCallback, useState } from 'react';

/**
 * Хук управления состоянием поиска по листам
 * Хранит поисковые запросы в виде Map: sheetId → query
 * @returns Объект с методами управления состоянием поиска
 */
export function useSheetSearchState() {
  const [searchQueries, setSearchQueries] = useState<Map<string, string>>(new Map());

  /**
   * Устанавливает поисковый запрос для конкретного листа
   * @param sheetId - Идентификатор листа
   * @param query - Поисковый запрос
   */
  const setSheetQuery = useCallback((sheetId: string, query: string) => {
    setSearchQueries((prev) => {
      const next = new Map(prev);
      next.set(sheetId, query);
      return next;
    });
  }, []);

  /**
   * Возвращает поисковый запрос для конкретного листа
   * @param sheetId - Идентификатор листа
   * @returns Текущий поисковый запрос или пустая строка
   */
  const getSheetQuery = useCallback(
    (sheetId: string): string => searchQueries.get(sheetId) ?? '',
    [searchQueries]
  );

  return { searchQueries, setSheetQuery, getSheetQuery };
}
