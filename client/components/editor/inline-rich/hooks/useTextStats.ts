/**
 * @fileoverview Хук для подсчёта слов и символов в тексте
 * @description Подсчитывает количество слов и символов, игнорируя HTML-теги и Markdown
 */

import { useMemo } from 'react';

/**
 * Результат работы хука useTextStats
 */
export interface TextStats {
  /** Количество слов в тексте */
  wordCount: number;
  /** Количество символов в тексте */
  charCount: number;
}

/**
 * Хук для подсчёта слов и символов в тексте
 * @param value - Текст для анализа
 * @returns Объект со статистикой (wordCount, charCount)
 */
export function useTextStats(value: string): TextStats {
  const wordCount = useMemo(() => {
    const plain = value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n/g, '')
      .replace(/\*\*|__|~~|`/g, '');
    return plain.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [value]);

  const charCount = useMemo(() => {
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n/g, '')
      .replace(/\*\*|__|~~|`/g, '').length;
  }, [value]);

  return { wordCount, charCount };
}
