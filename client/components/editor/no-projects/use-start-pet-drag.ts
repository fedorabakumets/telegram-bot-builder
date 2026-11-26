/** @fileoverview Перемещение питомца стартового экрана указателем и клавиатурой. */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clampPetPosition, initialPetPosition } from './start-pet-position';

/** Захват одного указателя сохраняет точку, за которую взяли питомца. */
interface PetGrab {
  /** Идентификатор мыши, пера или касания. */
  pointerId: number;
  /** Расстояние до левого края кнопки. */
  offsetX: number;
  /** Расстояние до верхнего края кнопки. */
  offsetY: number;
}

/** @returns Доступные размеры области размещения фиксированной кнопки. */
function viewport() {
  return { width: document.documentElement.clientWidth, height: window.innerHeight };
}

/**
 * Управляет позицией питомца в пределах текущей страницы.
 * @returns Координаты, признак перетаскивания и обработчики для кнопки.
 */
export function useStartPetDrag() {
  const [position, setPosition] = useState(() => initialPetPosition(viewport()));
  const [dragging, setDragging] = useState(false);
  const grab = useRef<PetGrab | null>(null);

  useEffect(() => {
    /** При сужении окна возвращает питомца в видимую область. */
    const resize = () => setPosition(current => clampPetPosition(current, viewport()));
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /**
   * Захватывает указатель, чтобы отпускание за пределами кнопки завершило жест.
   * @param event - Нажатие мышью, пером или пальцем.
   */
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (grab.current || !event.isPrimary || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    setDragging(true);
  }

  /**
   * Перемещает кнопку с сохранением точки захвата.
   * @param event - Текущие координаты указателя.
   */
  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = grab.current;
    if (!active || event.pointerId !== active.pointerId) return;
    setPosition(clampPetPosition({ x: event.clientX - active.offsetX, y: event.clientY - active.offsetY }, viewport()));
  }

  /**
   * Завершает жест при отпускании, отмене касания или потере захвата.
   * @param event - Событие завершающего указателя.
   */
  function finish(event: PointerEvent<HTMLButtonElement>) {
    if (grab.current?.pointerId !== event.pointerId) return;
    grab.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  /**
   * Стрелки перемещают питомца на восемь пикселей за шаг.
   * @param event - Нажатие клавиши на сфокусированной кнопке.
   */
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case 'ArrowLeft': dx = -8; break;
      case 'ArrowRight': dx = 8; break;
      case 'ArrowUp': dy = -8; break;
      case 'ArrowDown': dy = 8; break;
      default: return;
    }
    event.preventDefault();
    setPosition(current => clampPetPosition({ x: current.x + dx, y: current.y + dy }, viewport()));
  }

  return {
    position, dragging,
    handlers: { onPointerDown: start, onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish, onKeyDown: keyDown },
  };
}
