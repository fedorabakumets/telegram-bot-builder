/**
 * @fileoverview Хук для обработки горячих клавиш форматирования
 * @description Обрабатывает комбинации Ctrl/Cmd+клавиша для быстрого форматирования
 */

import { useCallback } from 'react';
import type { FormatOption } from '../format-options';

/**
 * Параметры хука useKeyboardShortcuts
 */
export interface UseKeyboardShortcutsOptions {
  /** Функция применения форматирования */
  applyFormatting: (format: FormatOption) => void;
  /** Функция отмены действия */
  undo: () => void;
  /** Функция повтора действия */
  redo: () => void;
  /** Массив опций форматирования */
  formatOptions: FormatOption[];
}

/**
 * Хук для обработки горячих клавиш форматирования
 * @param options - Параметры хука
 * @returns Обработчик onKeyDown для contenteditable элемента
 */
export function useKeyboardShortcuts({
  applyFormatting,
  undo,
  redo,
  formatOptions
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    const key = e.key.toLowerCase();
    const formatMap: Record<string, number> = {
      b: 0, // bold
      i: 1, // italic
      u: 2, // underline
      e: 4, // code
      q: 5, // quote
      h: 6  // heading
    };

    // Обработка форматирования
    if (formatMap[key] !== undefined) {
      e.preventDefault();
      applyFormatting(formatOptions[formatMap[key]]);
      return;
    }

    // Обработка зачёркивания (Ctrl+Shift+X)
    if (key === 'x' && e.shiftKey) {
      e.preventDefault();
      applyFormatting(formatOptions[3]);
      return;
    }

    // Обработка отмены/повтора
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
  }, [applyFormatting, undo, redo, formatOptions]);

  return { handleKeyDown };
}
