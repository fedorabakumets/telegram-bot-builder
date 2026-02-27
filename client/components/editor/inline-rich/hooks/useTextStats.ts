/**
 * @fileoverview Хук для подсчёта слов и символов в тексте
 * @description Подсчитывает количество слов и символов, игнорируя HTML-теги и Markdown
 */

import { useState, useEffect } from 'react';

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
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const plainText = value.replace(/<[^>]*>/g, '').replace(/\*\*|__|~~|`/g, '');
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(plainText.length);
  }, [value]);

  return { wordCount, charCount };
}
