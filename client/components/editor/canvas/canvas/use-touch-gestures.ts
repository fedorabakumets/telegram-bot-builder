/**
 * @fileoverview Хук для обработки touch-жестов на мобильных устройствах
 * 
 * Содержит логику панорамирования и масштабирования (pinch-to-zoom)
 * для компонента холста визуального редактора.
 */

import { useCallback, RefObject } from 'react';

/**
 * Свойства хука для обработки touch-жестов
 */
interface UseTouchGesturesProps {
  /** Ссылка на canvas элемент */
  canvasRef: RefObject<HTMLDivElement>;
  /** Текущее состояние панорамирования */
  pan: { x: number; y: number };
  /** Текущий масштаб (в процентах) */
  zoom: number;
  /** Установщик состояния панорамирования */
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  /** Установщик состояния масштаба */
  setZoom: (zoom: number) => void;
  /** Флаг активного touch-панорамирования */
  isTouchPanning: boolean;
  /** Установщик флага touch-панорамирования */
  setIsTouchPanning: (panning: boolean) => void;
  /** Начальная позиция касания */
  touchStart: { x: number; y: number };
  /** Установщик начальной позиции */
  setTouchStart: (pos: { x: number; y: number }) => void;
  /** Последняя позиция панорамирования */
  lastTouchPosition: { x: number; y: number };
  /** Установщик последней позиции */
  setLastTouchPosition: (pos: { x: number; y: number }) => void;
  /** Последнее расстояние pinch-жеста */
  lastPinchDistance: number;
  /** Установщик расстояния pinch-жеста */
  setLastPinchDistance: (dist: number) => void;
  /** Начальный масштаб pinch-жеста */
  initialPinchZoom: number;
  /** Установщик начального масштаба */
  setInitialPinchZoom: (zoom: number) => void;
  /** Флаг перетаскивания узла (из внешнего состояния) */
  isNodeBeingDragged?: boolean;
}

/**
 * Хук для обработки touch-жестов на мобильных устройствах
 * 
 * @param props - Свойства хука
 * @returns Объект с обработчиками touch-событий
 */
export function useTouchGestures({
  canvasRef,
  pan,
  zoom,
  setPan,
  setZoom,
  isTouchPanning,
  setIsTouchPanning,
  touchStart,
  setTouchStart,
  lastTouchPosition,
  setLastTouchPosition,
  lastPinchDistance,
  setLastPinchDistance,
  initialPinchZoom,
  setInitialPinchZoom,
  isNodeBeingDragged
}: UseTouchGesturesProps) {
  /**
   * Вычисление расстояния между двумя точками касания
   */
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Вычисление центра между двумя касаниями
   */
  const getTouchCenter = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  /**
   * Обработчик начала touch-события
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('[data-canvas-node]');

    if (isOnNode || isNodeBeingDragged) {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1) {
      const touch = touches[0];
      setIsTouchPanning(true);
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setLastTouchPosition(pan);
    } else if (touches.length === 2) {
      const distance = getTouchDistance(touches);
      setLastPinchDistance(distance);
      setInitialPinchZoom(zoom);
      setIsTouchPanning(false);
    }
  }, [pan, zoom, isNodeBeingDragged, setIsTouchPanning, setTouchStart, setLastTouchPosition, setLastPinchDistance, setInitialPinchZoom, getTouchDistance]);

  /**
   * Обработчик движения touch-события
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('[data-canvas-node]');

    if (isOnNode || isNodeBeingDragged) {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isTouchPanning) {
      const touch = touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      setPan({
        x: lastTouchPosition.x + deltaX,
        y: lastTouchPosition.y + deltaY
      });
    } else if (touches.length === 2) {
      const currentDistance = getTouchDistance(touches);
      const center = getTouchCenter(touches);

      if (lastPinchDistance > 0) {
        const scaleFactor = currentDistance / lastPinchDistance;
        const newZoom = Math.max(Math.min(initialPinchZoom * scaleFactor, 200), 10);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = center.x - rect.left;
          const centerY = center.y - rect.top;
          const zoomRatio = newZoom / zoom;

          setPan((prev: { x: number; y: number }) => ({
            x: centerX - (centerX - prev.x) * zoomRatio,
            y: centerY - (centerY - prev.y) * zoomRatio
          }));

          setZoom(newZoom);
        }
      }
    }
  }, [
    isTouchPanning,
    touchStart,
    lastTouchPosition,
    lastPinchDistance,
    initialPinchZoom,
    zoom,
    isNodeBeingDragged,
    getTouchDistance,
    getTouchCenter,
    setPan,
    setZoom,
    canvasRef
  ]);

  /**
   * Обработчик завершения touch-события
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 0) {
      setIsTouchPanning(false);
      setLastPinchDistance(0);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setLastTouchPosition(pan);
      setIsTouchPanning(true);
      setLastPinchDistance(0);
    }
  }, [pan, setIsTouchPanning, setTouchStart, setLastTouchPosition, setLastPinchDistance]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
