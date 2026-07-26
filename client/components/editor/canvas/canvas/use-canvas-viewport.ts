/**
 * @fileoverview Общий viewport холста: pan, zoom (%), wheel, touch, mouse
 * @module editor/canvas/use-canvas-viewport
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTouchGestures } from './use-touch-gestures';

/** Точка смещения камеры */
export interface CanvasPan {
  /** X в px экрана */
  x: number;
  /** Y в px экрана */
  y: number;
}

/** Опции viewport-хука */
export interface UseCanvasViewportOptions {
  /** Ref контейнера холста */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Пустой фон (для ЛКМ-pan) */
  isEmptyTarget: (target: HTMLElement) => boolean;
  /**
   * ЛКМ по пустому фону без Alt; вернуть true — съесть событие (marquee)
   */
  onEmptyLeftClick?: (e: ReactMouseEvent) => boolean;
  /** Сейчас тянут ноду */
  isNodeBeingDragged?: boolean;
  /** Мин. zoom % */
  minZoom?: number;
  /** Макс. zoom % */
  maxZoom?: number;
}

/**
 * Pan/zoom viewport как в редакторе (wheel, pinch, mouse pan)
 * @param options - Опции
 * @returns Состояние и хендлеры viewport
 */
export function useCanvasViewport({
  canvasRef,
  isEmptyTarget,
  onEmptyLeftClick,
  isNodeBeingDragged,
  minZoom = 1,
  maxZoom = 200,
}: UseCanvasViewportOptions) {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState<CanvasPan>({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const [animateTransform, setAnimateTransform] = useState(false);
  const animateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState<CanvasPan>({ x: 0, y: 0 });

  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTouchPosition, setLastTouchPosition] = useState<CanvasPan>({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [initialPinchZoom, setInitialPinchZoom] = useState(100);

  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ pan: CanvasPan; zoom: number } | null>(null);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const triggerTransformAnimation = useCallback(() => {
    setAnimateTransform(true);
    if (animateTimerRef.current) clearTimeout(animateTimerRef.current);
    animateTimerRef.current = setTimeout(() => setAnimateTransform(false), 220);
  }, []);

  const scheduleStateFlush = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const pending = pendingUpdateRef.current;
      if (!pending) return;
      pendingUpdateRef.current = null;
      setPan(pending.pan);
      setZoom(pending.zoom);
    });
  }, []);

  const scheduleFlush = useCallback((newPan: CanvasPan, newZoom: number) => {
    pendingUpdateRef.current = { pan: newPan, zoom: newZoom };
    scheduleStateFlush();
  }, [scheduleStateFlush]);

  const getContainerDimensions = useCallback(() => {
    if (canvasRef.current?.parentElement) {
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      return { width: rect.width - 64, height: rect.height - 64 };
    }
    return { width: window.innerWidth - 64, height: window.innerHeight - 64 };
  }, [canvasRef]);

  const zoomFromCenter = useCallback((newZoom: number) => {
    triggerTransformAnimation();
    const { width, height } = getContainerDimensions();
    const centerX = width / 2;
    const centerY = height / 2;
    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;
    const prevZoomPercent = currentZoom / 100;
    const newZoomPercent = newZoom / 100;
    const centerCanvasX = (centerX - currentPan.x) / prevZoomPercent;
    const centerCanvasY = (centerY - currentPan.y) / prevZoomPercent;
    const newPan = {
      x: centerX - centerCanvasX * newZoomPercent,
      y: centerY - centerCanvasY * newZoomPercent,
    };
    zoomRef.current = newZoom;
    panRef.current = newPan;
    setPan(newPan);
    setZoom(newZoom);
  }, [getContainerDimensions, triggerTransformAnimation]);

  const zoomIn = useCallback(() => {
    zoomFromCenter(Math.min(zoomRef.current * 1.05, maxZoom));
  }, [zoomFromCenter, maxZoom]);

  const zoomOut = useCallback(() => {
    zoomFromCenter(Math.max(zoomRef.current * 0.95, minZoom));
  }, [zoomFromCenter, minZoom]);

  const resetZoom = useCallback(() => {
    triggerTransformAnimation();
    zoomRef.current = 100;
    panRef.current = { x: 0, y: 0 };
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, [triggerTransformAnimation]);

  const setZoomLevel = useCallback((level: number) => {
    zoomFromCenter(Math.max(Math.min(level, maxZoom), minZoom));
  }, [zoomFromCenter, minZoom, maxZoom]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const sensitivity = 0.015;
      const zoomFactor = Math.max(0.7, Math.min(1.4, 1 - e.deltaY * sensitivity));
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const newZoom = Math.max(Math.min(currentZoom * zoomFactor, maxZoom), minZoom);
      const rect = canvasRef.current?.getBoundingClientRect();
      const pointerX = rect ? e.clientX - rect.left : 0;
      const pointerY = rect ? e.clientY - rect.top : 0;
      const zoomRatio = newZoom / currentZoom;
      const newPan = {
        x: pointerX - (pointerX - currentPan.x) * zoomRatio,
        y: pointerY - (pointerY - currentPan.y) * zoomRatio,
      };
      zoomRef.current = newZoom;
      panRef.current = newPan;
      scheduleFlush(newPan, newZoom);
    } else {
      const currentPan = panRef.current;
      const newPan = { x: currentPan.x - e.deltaX, y: currentPan.y - e.deltaY };
      panRef.current = newPan;
      scheduleFlush(newPan, zoomRef.current);
    }
  }, [canvasRef, maxZoom, minZoom, scheduleFlush]);

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    const target = e.target as HTMLElement;
    const empty = isEmptyTarget(target);
    if (e.button === 0 && !e.altKey && empty && onEmptyLeftClick?.(e)) return;
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) || (e.button === 0 && empty)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setLastPanPosition(panRef.current);
    }
  }, [isEmptyTarget, onEmptyLeftClick]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleContextMenu = useCallback((e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-canvas-node]')) return;
    e.preventDefault();
  }, []);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    canvasRef: canvasRef as RefObject<HTMLDivElement>,
    pan,
    zoom,
    panRef,
    zoomRef,
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
    isNodeBeingDragged,
  });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const newPan = {
        x: lastPanPosition.x + (e.clientX - panStart.x),
        y: lastPanPosition.y + (e.clientY - panStart.y),
      };
      panRef.current = newPan;
      scheduleFlush(newPan, zoomRef.current);
    };
    const onUp = () => setIsPanning(false);
    const preventPageZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    if (isPanning) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    document.addEventListener('wheel', preventPageZoom, { passive: false });
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('wheel', preventPageZoom);
    };
  }, [isPanning, panStart, lastPanPosition, scheduleFlush]);

  return {
    pan,
    zoom,
    setPan,
    setZoom,
    panRef,
    zoomRef,
    isPanning,
    animateTransform,
    triggerTransformAnimation,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    zoomFromCenter,
    getContainerDimensions,
    scheduleStateFlush,
    scheduleFlush,
    handleMouseDown,
    handleMouseUp,
    handleContextMenu,
  };
}
