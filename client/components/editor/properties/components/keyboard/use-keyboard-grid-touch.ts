/**
 * @fileoverview Touch-перетаскивание кнопок в превью раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/use-keyboard-grid-touch
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Цель сброса по data-атрибутам */
interface DropTarget {
  /** Индекс ряда */
  row: number;
  /** Индекс в ряду */
  index: number;
}

/**
 * Читает цель сброса из элемента под пальцем
 * @param clientX - X касания
 * @param clientY - Y касания
 * @returns Цель или null
 */
function readDropTarget(clientX: number, clientY: number): DropTarget | null {
  const el = document.elementFromPoint(clientX, clientY);
  const target = el?.closest('[data-kb-drop]') as HTMLElement | null;
  if (!target) return null;
  const row = Number(target.dataset.kbDropRow);
  const index = Number(target.dataset.kbDropIndex);
  if (!Number.isFinite(row) || !Number.isFinite(index)) return null;
  return { row, index };
}

/**
 * Хук touch-DnD для сетки кнопок клавиатуры
 * @param disabled - Перетаскивание выключено
 * @param onMoveButton - Колбэк перемещения
 * @returns Обработчики и id перетаскиваемой кнопки
 */
export function useKeyboardGridTouch(
  disabled: boolean,
  onMoveButton: (buttonId: string, toRow: number, toIndex: number) => void,
) {
  const dragRef = useRef<{
    buttonId: string;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);
  const onMoveRef = useRef(onMoveButton);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    onMoveRef.current = onMoveButton;
  }, [onMoveButton]);

  const clearDrag = useCallback(() => {
    dragRef.current = null;
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (!draggingId) return;

    const onMove = (e: TouchEvent) => {
      if (!dragRef.current?.active) return;
      e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      const drag = dragRef.current;
      const touch = e.changedTouches[0];
      clearDrag();
      if (!drag?.active || !touch || disabled) return;
      const drop = readDropTarget(touch.clientX, touch.clientY);
      if (!drop) return;
      onMoveRef.current(drag.buttonId, drop.row, drop.index);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', clearDrag);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', clearDrag);
    };
  }, [draggingId, disabled, clearDrag]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent, buttonId: string) => {
      if (disabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      dragRef.current = {
        buttonId,
        startX: touch.clientX,
        startY: touch.clientY,
        active: false,
      };
    },
    [disabled],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const drag = dragRef.current;
      if (!drag || disabled || drag.active) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 10) {
        drag.active = true;
        setDraggingId(drag.buttonId);
      }
    },
    [disabled],
  );

  const onTouchEnd = useCallback(() => {
    if (!dragRef.current?.active) clearDrag();
  }, [clearDrag]);

  return {
    draggingId,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: clearDrag,
  };
}
