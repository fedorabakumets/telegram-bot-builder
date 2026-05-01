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

    /** e.code не зависит от раскладки клавиатуры (ru/en), e.key — зависит */
    const key = e.key.toLowerCase();
    const code = e.code; // например 'KeyX', 'KeyS', 'KeyZ', 'KeyK'

    // Горячая клавиша для ссылки (Ctrl+K)
    if (code === 'KeyK' || key === 'k') {
      e.preventDefault();
      onLinkShortcut?.();
      return;
    }

    // Обработка отмены/повтора (Ctrl+Z / Ctrl+Shift+Z)
    if (code === 'KeyZ' || key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }

    // Ctrl+Shift+X — зачёркивание, Ctrl+Shift+S — спойлер
    if (e.shiftKey) {
      const shiftCodeMap: Record<string, string> = {
        KeyX: 'strikethrough',
        KeyS: 'spoiler',
      };
      const command = shiftCodeMap[code];
      if (command) {
        e.preventDefault();
        const option = formatOptions.find(f => f.command === command);
        if (option) applyFormatting(option);
      }
      return;
    }

    /** Маппинг code → команда форматирования (без Shift) */
    const codeMap: Record<string, string> = {
      KeyB: 'bold',
      KeyI: 'italic',
      KeyU: 'underline',
      KeyE: 'code',
      KeyQ: 'quote',
    };

    const command = codeMap[code];
    if (command) {
      e.preventDefault();
      const option = formatOptions.find(f => f.command === command);
      if (option) applyFormatting(option);
    }
  }, [applyFormatting, undo, redo, formatOptions, onLinkShortcut]);

  return { handleKeyDown };
}
