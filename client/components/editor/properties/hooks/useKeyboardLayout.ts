/**
 * @fileoverview Хук для управления раскладкой клавиатуры
 * @module components/editor/properties/hooks/useKeyboardLayout
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/lib/bot-generator';
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
 * @returns Объект с методами управления
 */
export function useKeyboardLayout(buttons: Button[], initialLayout?: KeyboardLayout): UseKeyboardLayoutReturn {
  const [layout, setLayout] = useState<KeyboardLayout>(() => {
    if (initialLayout) return initialLayout;
    return createLayoutFromButtons(buttons, 2);
  });

  const setColumns = useCallback((columns: number) => {
    setLayout(prev => updateLayoutColumns(prev, buttons, columns));
  }, [buttons]);

  const toggleAutoLayout = useCallback(() => {
    setLayout(prev => ({ ...prev, autoLayout: !prev.autoLayout }));
  }, []);

  const moveButtonCallback = useCallback((buttonId: string, toRow: number, toIndex: number) => {
    setLayout(prev => moveButton(prev, buttonId, toRow, toIndex));
  }, []);

  const addRow = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      rows: [...prev.rows, { buttonIds: [] }],
    }));
  }, []);

  const removeRow = useCallback((rowIndex: number) => {
    setLayout(prev => ({
      ...prev,
      rows: prev.rows.filter((_, idx) => idx !== rowIndex),
    }));
  }, []);

  return useMemo(() => ({
    layout,
    setColumns,
    toggleAutoLayout,
    moveButton: moveButtonCallback,
    addRow,
    removeRow,
  }), [layout, setColumns, toggleAutoLayout, moveButtonCallback, addRow, removeRow]);
}
