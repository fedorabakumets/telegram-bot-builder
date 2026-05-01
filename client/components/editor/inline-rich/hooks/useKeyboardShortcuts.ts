/**
 * @fileoverview Хук для обработки горячих клавиш форматирования
 * @description Обрабатывает комбинации Ctrl/Cmd+клавиша для быстрого форматирования.
 * Включает поддержку Ctrl+Shift+S для вставки спойлера.
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
  /** Callback для открытия попапа ссылки (Ctrl+K) */
  onLinkShortcut?: () => void;
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
  formatOptions,
  onLinkShortcut
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    const key = e.key.toLowerCase();

    // Горячая клавиша для ссылки (Ctrl+K)
    if (key === 'k') {
      e.preventDefault();
      onLinkShortcut?.();
      return;
    }

    // Обработка отмены/повтора
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }

    // Ctrl+Shift+X — зачёркивание, Ctrl+Shift+S — спойлер
    if (e.shiftKey) {
      const shiftMap: Record<string, string> = {
        x: 'strikethrough',
        s: 'spoiler',
      };
      const command = shiftMap[key];
      if (command) {
        e.preventDefault();
        const option = formatOptions.find(f => f.command === command);
        if (option) applyFormatting(option);
      }
      return;
    }

    /** Маппинг клавиши → команда форматирования (без Shift) */
    const keyMap: Record<string, string> = {
      b: 'bold',
      i: 'italic',
      u: 'underline',
      e: 'code',
      q: 'quote',
    };

    const command = keyMap[key];
    if (command) {
      e.preventDefault();
      const option = formatOptions.find(f => f.command === command);
      if (option) applyFormatting(option);
    }
  }, [applyFormatting, undo, redo, formatOptions, onLinkShortcut]);

  return { handleKeyDown };
}
