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
  /** Ref-зеркало текущего смещения (для синхронного доступа в жесте) */
  panRef?: { current: { x: number; y: number } };
  /** Ref-зеркало текущего масштаба (для синхронного доступа в жесте) */
  zoomRef?: { current: number };
  /** Колбэк начала/продолжения интерактивного жеста (отключает CSS-переход) */
  onInteract?: () => void;
  /** Колбэк планирования обновления pan/zoom через RAF (один рендер за кадр) */
  scheduleFlush?: (pan: { x: number; y: number }, zoom: number) => void;
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
  panRef,
  zoomRef,
  onInteract,
  scheduleFlush,
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
  const getTouchDistance = useCallback((touches: TouchList) => {
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
  const getTouchCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  /**
   * Обработчик начала touch-события (нативный, для { passive: false })
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
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
      setLastTouchPosition(panRef?.current ?? pan);
    } else if (touches.length === 2) {
      const distance = getTouchDistance(touches);
      setLastPinchDistance(distance);
      setInitialPinchZoom(zoomRef?.current ?? zoom);
      setIsTouchPanning(false);
    }
  }, [pan, zoom, panRef, zoomRef, isNodeBeingDragged, setIsTouchPanning, setTouchStart, setLastTouchPosition, setLastPinchDistance, setInitialPinchZoom, getTouchDistance]);

  /**
   * Обработчик движения touch-события (нативный, для { passive: false })
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
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
    onInteract?.();

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
          // Берём актуальные pan/zoom из refs (если переданы), иначе из props.
          // Refs синхронны и не «застревают» между быстрыми событиями жеста.
          const currentZoom = zoomRef?.current ?? zoom;
          const currentPan = panRef?.current ?? pan;
          const zoomRatio = newZoom / currentZoom;

          const newPan = {
            x: centerX - (centerX - currentPan.x) * zoomRatio,
            y: centerY - (centerY - currentPan.y) * zoomRatio,
          };

          if (panRef) panRef.current = newPan;
          if (zoomRef) zoomRef.current = newZoom;
          if (scheduleFlush) {
            scheduleFlush(newPan, newZoom);
          } else {
            setPan(newPan);
            setZoom(newZoom);
          }
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
    pan,
    panRef,
    zoomRef,
    onInteract,
    scheduleFlush,
    isNodeBeingDragged,
    getTouchDistance,
    getTouchCenter,
    setPan,
    setZoom,
    canvasRef
  ]);

  /**
   * Обработчик завершения touch-события (нативный, для { passive: false })
   */
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length === 0) {
      setIsTouchPanning(false);
      setLastPinchDistance(0);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setLastTouchPosition(panRef?.current ?? pan);
      setIsTouchPanning(true);
      setLastPinchDistance(0);
    }
  }, [pan, panRef, setIsTouchPanning, setTouchStart, setLastTouchPosition, setLastPinchDistance]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
