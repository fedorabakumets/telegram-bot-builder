/**
 * @fileoverview Хук фильтрации строк терминала по типу (stdout/stderr)
 * @module useTerminalFilter
 */

import { useState } from 'react';
import { TerminalLine } from './terminalTypes';

/** Тип фильтра: все строки, только stdout или только stderr */
export type LogFilter = 'all' | 'stdout' | 'stderr';

/** Результат хука фильтрации */
interface UseTerminalFilterResult {
  /** Текущий активный фильтр */
  filter: LogFilter;
  /** Установить новый фильтр */
  setFilter: (f: LogFilter) => void;
  /** Применить фильтр к массиву строк */
  filterLines: (lines: TerminalLine[]) => TerminalLine[];
  /** Подсчитать количество строк stderr */
  stderrCount: (lines: TerminalLine[]) => number;
}

/**
 * Хук для фильтрации строк терминала по типу вывода
 * @returns Объект с текущим фильтром, сеттером и функциями фильтрации
 */
export function useTerminalFilter(): UseTerminalFilterResult {
  const [filter, setFilter] = useState<LogFilter>('all');

  /**
   * Фильтрует массив строк по текущему фильтру
   * @param lines - Массив строк терминала
   * @returns Отфильтрованный массив строк
   */
  const filterLines = (lines: TerminalLine[]): TerminalLine[] => {
    if (filter === 'all') return lines;
    return lines.filter((line) => line.type === filter);
  };

  /**
   * Считает количество строк с типом stderr
   * @param lines - Массив строк терминала
   * @returns Количество строк stderr
   */
  const stderrCount = (lines: TerminalLine[]): number =>
    lines.filter((line) => line.type === 'stderr').length;

  return { filter, setFilter, filterLines, stderrCount };
}
