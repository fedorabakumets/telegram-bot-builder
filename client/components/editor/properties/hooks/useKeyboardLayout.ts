/**
 * @fileoverview Хук для управления раскладкой клавиатуры
 * @module components/editor/properties/hooks/useKeyboardLayout
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
    const currentButtonsLength = buttons.length;
    const prevButtonsLength = prevButtonsLengthRef.current;

    // Обновляем только если количество кнопок изменилось
    if (currentButtonsLength !== prevButtonsLength) {
      if (layout.autoLayout) {
        setLayout(createLayoutFromButtons(buttons, layout.columns));
      } else {
        // В ручном режиме тоже пересоздаём, если количество изменилось
        setLayout(createLayoutFromButtons(buttons, layout.columns));
      }
      prevButtonsLengthRef.current = currentButtonsLength;
    }
  }, [buttons.length, layout.autoLayout, layout.columns]);

  const setColumns = useCallback((columns: number) => {
    setLayout(prev => updateLayoutColumns(prev, buttons, columns));
  }, [buttons]);

  const toggleAutoLayout = useCallback(() => {
    setLayout(prev => {
      const newAutoLayout = !prev.autoLayout;
      // При включении авто-раскладки сбрасываем до 2 колонок
      if (newAutoLayout) {
        return createLayoutFromButtons(buttons, 2);
      }
      return { ...prev, autoLayout: newAutoLayout };
    });
  }, [buttons]);

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
