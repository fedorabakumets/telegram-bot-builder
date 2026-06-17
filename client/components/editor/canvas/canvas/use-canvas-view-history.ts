/**
 * @fileoverview Хук стека предыдущих видов холста (pan/zoom)
 * @module client/components/editor/canvas/canvas/use-canvas-view-history
 */

import { useCallback, useRef, useState } from 'react';

/**
 * Снимок состояния вида холста
 */
export interface CanvasViewState {
  /** Смещение панорамирования */
  pan: { x: number; y: number };
  /** Масштаб в процентах */
  zoom: number;
}

/**
 * Создаёт копию состояния вида
 * @param pan - Смещение панорамирования
 * @param zoom - Масштаб в процентах
 * @returns Новый объект состояния вида
 */
export function createCanvasViewState(
  pan: { x: number; y: number },
  zoom: number,
): CanvasViewState {
  return { pan: { x: pan.x, y: pan.y }, zoom };
}

/**
 * Добавляет состояние в стек с ограничением глубины
 * @param stack - Текущий стек состояний
 * @param state - Новое состояние для добавления
 * @param maxDepth - Максимальная глубина стека
 * @returns Обновлённый стек
 */
export function pushCanvasViewState(
  stack: CanvasViewState[],
  state: CanvasViewState,
  maxDepth: number,
): CanvasViewState[] {
  const next = [...stack, state];
  if (next.length > maxDepth) {
    return next.slice(next.length - maxDepth);
  }
  return next;
}

/**
 * Извлекает последнее состояние из стека
 * @param stack - Текущий стек состояний
 * @returns Кортеж [новый стек, извлечённое состояние или null]
 */
export function popCanvasViewState(
  stack: CanvasViewState[],
): [CanvasViewState[], CanvasViewState | null] {
  if (stack.length === 0) {
    return [stack, null];
  }
  const restored = stack[stack.length - 1];
  return [stack.slice(0, -1), restored];
}

/**
 * Управляет стеком предыдущих видов холста для отмены программного фокуса на узле
 * @param maxDepth - Максимальное число уровней истории (по умолчанию 8)
 * @returns API стека: push, restore, canRestore, clear
 */
export function useCanvasViewHistory(maxDepth = 8) {
  const stackRef = useRef<CanvasViewState[]>([]);
  const [stackSize, setStackSize] = useState(0);

  /**
   * Сохраняет текущий вид перед программным переходом
   * @param pan - Текущее смещение
   * @param zoom - Текущий масштаб
   */
  const pushView = useCallback((pan: { x: number; y: number }, zoom: number) => {
    stackRef.current = pushCanvasViewState(
      stackRef.current,
      createCanvasViewState(pan, zoom),
      maxDepth,
    );
    setStackSize(stackRef.current.length);
  }, [maxDepth]);

  /**
   * Восстанавливает предыдущий вид из стека
   * @returns Восстановленное состояние или null, если стек пуст
   */
  const restorePreviousView = useCallback((): CanvasViewState | null => {
    const [nextStack, restored] = popCanvasViewState(stackRef.current);
    stackRef.current = nextStack;
    setStackSize(nextStack.length);
    return restored;
  }, []);

  /**
   * Очищает стек (например, при смене листа)
   */
  const clear = useCallback(() => {
    stackRef.current = [];
    setStackSize(0);
  }, []);

  return {
    pushView,
    restorePreviousView,
    canRestore: stackSize > 0,
    clear,
  };
}
