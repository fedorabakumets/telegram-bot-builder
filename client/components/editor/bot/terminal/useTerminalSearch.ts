/**
 * @fileoverview Хук поиска по строкам терминала
 *
 * Предоставляет состояние поиска, навигацию между совпадениями
 * и пересчёт индексов при изменении запроса или строк.
 *
 * @module useTerminalSearch
 */

import { useState, useMemo, useCallback } from 'react';
import { TerminalLine } from './terminalTypes';

/** Результат хука поиска по терминалу */
export interface UseTerminalSearchResult {
  /** Текущий поисковый запрос */
  searchQuery: string;
  /** Индексы строк с совпадениями */
  matchIndices: number[];
  /** Текущий индекс в массиве совпадений */
  currentMatchIndex: number;
  /** Установить поисковый запрос */
  setSearchQuery: (query: string) => void;
  /** Перейти к следующему совпадению */
  goToNextMatch: () => void;
  /** Перейти к предыдущему совпадению */
  goToPrevMatch: () => void;
  /** Очистить поиск */
  clearSearch: () => void;
}

/**
 * Хук для поиска по строкам терминала с навигацией между совпадениями
 * @param lines - Массив видимых строк терминала
 * @returns Объект с состоянием поиска и методами навигации
 */
export function useTerminalSearch(lines: TerminalLine[]): UseTerminalSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  /** Индексы строк, содержащих совпадения (case-insensitive) */
  const matchIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const indices: number[] = [];
    lines.forEach((line, idx) => {
      if (line.content.toLowerCase().includes(query)) {
        indices.push(idx);
      }
    });
    return indices;
  }, [searchQuery, lines]);

  /** Перейти к следующему совпадению (циклически) */
  const goToNextMatch = useCallback(() => {
    if (matchIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length);
  }, [matchIndices.length]);

  /** Перейти к предыдущему совпадению (циклически) */
  const goToPrevMatch = useCallback(() => {
    if (matchIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length);
  }, [matchIndices.length]);

  /** Сбросить поиск */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  /** Сбрасываем индекс при изменении количества совпадений */
  const safeCurrentIndex = matchIndices.length === 0
    ? 0
    : Math.min(currentMatchIndex, matchIndices.length - 1);

  return {
    searchQuery,
    matchIndices,
    currentMatchIndex: safeCurrentIndex,
    setSearchQuery,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
  };
}
