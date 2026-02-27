/**
 * @fileoverview Хук для управления отменой/повтором действий
 * @description Предоставляет функции undo, redo и saveToUndoStack для работы со стеками
 */

import { useState, useCallback } from 'react';

/**
 * Результат работы хука useUndoRedo
 */
export interface UseUndoRedoReturn {
  /** Стек отменённых значений */
  undoStack: string[];
  /** Стек повторённых значений */
  redoStack: string[];
  /** Функция сохранения текущего значения в стек отмены */
  saveToUndoStack: () => void;
  /** Функция отмены последнего действия */
  undo: () => void;
  /** Функция повтора отменённого действия */
  redo: () => void;
}

/**
 * Хук для управления отменой/повтором действий
 * @param value - Текущее значение
 * @param onChange - Функция обратного вызова при изменении значения
 * @param toast - Функция для показа уведомлений
 * @returns Объект с функциями undo/redo и стеками
 */
export function useUndoRedo(
  value: string,
  onChange: (value: string) => void,
  toast: (options: { title: string; description: string; variant: string }) => void
): UseUndoRedoReturn {
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), value]);
    setRedoStack([]);
  }, [value]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousValue = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, value]);
      setUndoStack(prev => prev.slice(0, -1));
      onChange(previousValue);
      toast({
        title: "Отменено",
        description: "Последнее действие отменено",
        variant: "default"
      });
    }
  }, [undoStack, value, onChange, toast]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextValue = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, value]);
      setRedoStack(prev => prev.slice(0, -1));
      onChange(nextValue);
      toast({
        title: "Повторено",
        description: "Действие повторено",
        variant: "default"
      });
    }
  }, [redoStack, value, onChange, toast]);

  return { undoStack, redoStack, saveToUndoStack, undo, redo };
}
