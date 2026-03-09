/**
 * @fileoverview Утилита для вычисления статистики кода
 *
 * Анализирует код и возвращает статистику.
 *
 * @module GetCodeStats
 */

import type { CodeStats } from '../types';

/**
 * Вычисляет статистику кода
 *
 * @param content - Исходный код
 * @param showFullCode - Флаг показа полного кода
 * @param lineCount - Количество строк
 * @returns Статистика кода
 */
export function getCodeStats(
  content: string,
  showFullCode: boolean,
  lineCount: number
): CodeStats {
  return {
    totalLines: lineCount,
    truncated: !showFullCode && lineCount > 1000,
    functions: (content.match(/^def |^async def /gm) || []).length,
    classes: (content.match(/^class /gm) || []).length,
    comments: (content.match(/^[^#]*#/gm) || []).length,
  };
}
