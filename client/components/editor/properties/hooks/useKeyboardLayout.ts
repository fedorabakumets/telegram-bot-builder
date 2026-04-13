/**
 * @fileoverview Хук для управления раскладкой клавиатуры
 * @module components/editor/properties/hooks/useKeyboardLayout
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '@lib/bot-generator';
import { KeyboardLayout } from '../types/keyboard-layout';
import { createLayoutFromButtons, updateLayoutColumns, moveButton } from '../utils/keyboard-layout-utils';

/** Результат работы хука useKeyboardLayout */
export interface UseKeyboardLayoutReturn {
  /** Текущая раскладка */
  layout: KeyboardLayout;
  /** Установить количество колонок */
  setColumns: (columns: number) => void;
  /** Переключить автоматическую раскладку */
  toggleAutoLayout: () => void;
  /** Переместить кнопку */
  moveButton: (buttonId: string, toRow: number, toIndex: number) => void;
  /** Добавить пустой ряд */
  addRow: () => void;
  /** Удалить ряд */
  removeRow: (rowIndex: number) => void;
}

/**
 * Хук для управления раскладкой клавиатуры
 * @param buttons - Массив кнопок узла
 * @param initialLayout - Начальная раскладка (опционально)
 * @param onLayoutChange - Колбэк при изменении раскладки (вызывается синхронно)
 * @returns Объект с методами управления
 */
export function useKeyboardLayout(
  buttons: Button[],
  initialLayout?: KeyboardLayout,
  onLayoutChange?: (layout: KeyboardLayout) => void,
): UseKeyboardLayoutReturn {
  const [layout, setLayout] = useState<KeyboardLayout>(() => {
    if (initialLayout) return initialLayout;
    return createLayoutFromButtons(buttons, 2);
  });

  const prevButtonsLengthRef = useRef(buttons.length);
  const isFirstRenderRef = useRef(true);

  // Синхронизируем с initialLayout только при первом рендере
  useEffect(() => {
    if (isFirstRenderRef.current && initialLayout) {
      setLayout(initialLayout);
      isFirstRenderRef.current = false;
    }
  }, []);

  // Синхронизируем раскладку при изменении количества кнопок
  useEffect(() => {
    const currentLen = buttons.length;
    if (currentLen !== prevButtonsLengthRef.current) {
      setLayout(createLayoutFromButtons(buttons, layout.columns));
      prevButtonsLengthRef.current = currentLen;
    }
  }, [buttons.length, layout.columns]);

  /**
   * Устанавливает количество колонок и уведомляет об изменении
   * @param columns - Новое количество колонок
   */
  const setColumns = useCallback((columns: number) => {
    setLayout(prev => {
      const next = updateLayoutColumns(prev, buttons, columns);
      onLayoutChange?.(next);
      return next;
    });
  }, [buttons, onLayoutChange]);

  /**
   * Переключает режим авто-раскладки и уведомляет об изменении
   */
  const toggleAutoLayout = useCallback(() => {
    setLayout(prev => {
      const next = !prev.autoLayout
        ? createLayoutFromButtons(buttons, 2)
        : { ...prev, autoLayout: false };
      onLayoutChange?.(next);
      return next;
    });
  }, [buttons, onLayoutChange]);

  /**
   * Перемещает кнопку и уведомляет об изменении синхронно
   * @param buttonId - ID перемещаемой кнопки
   * @param toRow - Целевой ряд
   * @param toIndex - Позиция в ряду
   */
  const moveButtonCallback = useCallback((buttonId: string, toRow: number, toIndex: number) => {
    setLayout(prev => {
      const next = moveButton(prev, buttonId, toRow, toIndex);
      onLayoutChange?.(next);
      return next;
    });
  }, [onLayoutChange]);

  /**
   * Добавляет пустой ряд и уведомляет об изменении
   */
  const addRow = useCallback(() => {
    setLayout(prev => {
      const next = { ...prev, rows: [...prev.rows, { buttonIds: [] }] };
      onLayoutChange?.(next);
      return next;
    });
  }, [onLayoutChange]);

  /**
   * Удаляет ряд по индексу и уведомляет об изменении
   * @param rowIndex - Индекс удаляемого ряда
   */
  const removeRow = useCallback((rowIndex: number) => {
    setLayout(prev => {
      const next = { ...prev, rows: prev.rows.filter((_, idx) => idx !== rowIndex) };
      onLayoutChange?.(next);
      return next;
    });
  }, [onLayoutChange]);

  return useMemo(() => ({
    layout,
    setColumns,
    toggleAutoLayout,
    moveButton: moveButtonCallback,
    addRow,
    removeRow,
  }), [layout, setColumns, toggleAutoLayout, moveButtonCallback, addRow, removeRow]);
}
