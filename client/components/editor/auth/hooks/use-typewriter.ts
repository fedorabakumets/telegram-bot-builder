/**
 * @fileoverview Хук посимвольного появления текста (как реплики в играх)
 * @module components/editor/auth/hooks/use-typewriter
 */

import { useEffect, useState } from 'react';

/** Параметры хука печатного текста */
export interface UseTypewriterOptions {
  /** Задержка перед стартом (мс) */
  delayMs?: number;
  /** Интервал между символами (мс) */
  speedMs?: number;
  /** Выключена ли анимация (сразу полный текст) */
  disabled?: boolean;
}

/** Результат хука печатного текста */
export interface UseTypewriterResult {
  /** Уже показанная часть строки */
  text: string;
  /** Печать завершена */
  done: boolean;
}

/**
 * Постепенно раскрывает строку по символам
 * @param fullText - Полный текст
 * @param options - Скорость и задержка
 * @returns Показанный фрагмент и флаг завершения
 */
export function useTypewriter(
  fullText: string,
  options: UseTypewriterOptions = {},
): UseTypewriterResult {
  const { delayMs = 300, speedMs = 32, disabled = false } = options;
  const [count, setCount] = useState(disabled ? fullText.length : 0);

  useEffect(() => {
    if (disabled) {
      setCount(fullText.length);
      return;
    }

    setCount(0);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCount((prev) => {
          if (prev >= fullText.length) {
            if (intervalId) clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fullText, delayMs, speedMs, disabled]);

  return {
    text: fullText.slice(0, count),
    done: count >= fullText.length,
  };
}
