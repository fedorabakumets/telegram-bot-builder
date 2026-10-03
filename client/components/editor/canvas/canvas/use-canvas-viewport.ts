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
import type { ViewportPan } from './paint-editor-viewport';
import { scheduleViewportRelease } from './schedule-viewport-release';

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
  /**
   * Кадр жеста без setState. Третий аргумент — запечь слой (зум).
   * Если задан, pan/zoom коммитятся в React только в конце жеста.
   */
  paintFrame?: (pan: ViewportPan, zoom: number, promote?: boolean) => void;
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
  paintFrame,
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
  const paintFrameRef = useRef(paintFrame);
  paintFrameRef.current = paintFrame;
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Жест идёт: рендер читает refs. Без setState, чтобы не будить холст */
  const viewportLiveRef = useRef(false);
  /** В этом жесте масштаб уже менялся — слой запечён */
  const promoteRef = useRef(false);
  /** Масштаб, уже записанный в DOM или в React */
  const paintedZoomRef = useRef(100);
  const cancelReleaseRef = useRef<(() => void) | null>(null);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => {
    if (!viewportLiveRef.current) paintedZoomRef.current = zoom;
  }, [zoom]);

  const triggerTransformAnimation = useCallback(() => {
    setAnimateTransform(true);
    if (animateTimerRef.current) clearTimeout(animateTimerRef.current);
    animateTimerRef.current = setTimeout(() => setAnimateTransform(false), 220);
  }, []);

  /** Отменяет отложенное снятие will-change, если жест продолжился */
  const cancelRelease = useCallback(() => {
    cancelReleaseRef.current?.();
    cancelReleaseRef.current = null;
  }, []);

  /**
   * После жеста: один кадр без will-change (резкий рерастр), затем pan/zoom в React.
   * Пока жест идёт, setState не вызывается.
   */
  const commitViewport = useCallback(() => {
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    const pending = pendingUpdateRef.current;
    pendingUpdateRef.current = null;
    if (!viewportLiveRef.current && !pending) return;
    if (pending) paintFrameRef.current?.(pending.pan, pending.zoom, promoteRef.current);
    cancelRelease();
    cancelReleaseRef.current = scheduleViewportRelease(
      () => canvasRef.current,
      () => {
        cancelReleaseRef.current = null;
        viewportLiveRef.current = false;
        promoteRef.current = false;
        const nextPan = panRef.current;
        const nextZoom = zoomRef.current;
        setPan((prev) => (
          prev.x === nextPan.x && prev.y === nextPan.y ? prev : { x: nextPan.x, y: nextPan.y }
        ));
        setZoom((prev) => (prev === nextZoom ? prev : nextZoom));
      },
    );
  }, [canvasRef, cancelRelease]);

  /** Коммит после паузы колеса: у wheel нет mouseup */
  const armWheelCommit = useCallback(() => {
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      wheelTimerRef.current = null;
      commitViewport();
    }, 100);
  }, [commitViewport]);

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
    if (!paintFrameRef.current) {
      scheduleStateFlush();
      return;
    }
    cancelRelease();
    if (!viewportLiveRef.current) {
      viewportLiveRef.current = true;
      promoteRef.current = false;
    }
    if (newZoom !== paintedZoomRef.current) promoteRef.current = true;
    paintedZoomRef.current = newZoom;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const pending = pendingUpdateRef.current;
      if (!pending) return;
      pendingUpdateRef.current = null;
      paintFrameRef.current?.(pending.pan, pending.zoom, promoteRef.current);
    });
  }, [scheduleStateFlush, cancelRelease]);

  useEffect(() => () => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    cancelReleaseRef.current?.();
  }, []);

  const getContainerDimensions = useCallback(() => {
    if (canvasRef.current?.parentElement) {
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      return { width: rect.width - 64, height: rect.height - 64 };
    }
    return { width: window.innerWidth - 64, height: window.innerHeight - 64 };
  }, [canvasRef]);

  /**
   * Зум к центру видимой области.
   * С paintFrame — один запечённый кадр и коммит, без CSS transition 200 мс.
   * Без paintFrame (холст ботов) — прежняя анимация.
   * @param newZoom - Новый масштаб в процентах
   */
  const zoomFromCenter = useCallback((newZoom: number) => {
    if (newZoom === zoomRef.current) return;
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
    if (paintFrameRef.current) {
      viewportLiveRef.current = true;
      promoteRef.current = true;
      paintedZoomRef.current = newZoom;
      pendingUpdateRef.current = { pan: newPan, zoom: newZoom };
      paintFrameRef.current(newPan, newZoom, true);
      commitViewport();
      return;
    }
    triggerTransformAnimation();
    setPan(newPan);
    setZoom(newZoom);
  }, [getContainerDimensions, triggerTransformAnimation, commitViewport]);

  const zoomIn = useCallback(() => {
    zoomFromCenter(Math.min(zoomRef.current * 1.05, maxZoom));
  }, [zoomFromCenter, maxZoom]);

  const zoomOut = useCallback(() => {
    zoomFromCenter(Math.max(zoomRef.current * 0.95, minZoom));
  }, [zoomFromCenter, minZoom]);

  const resetZoom = useCallback(() => {
    if (zoomRef.current === 100 && panRef.current.x === 0 && panRef.current.y === 0) return;
    const newPan = { x: 0, y: 0 };
    zoomRef.current = 100;
    panRef.current = newPan;
    if (paintFrameRef.current) {
      viewportLiveRef.current = true;
      promoteRef.current = true;
      paintedZoomRef.current = 100;
      pendingUpdateRef.current = { pan: newPan, zoom: 100 };
      paintFrameRef.current(newPan, 100, true);
      commitViewport();
      return;
    }
    triggerTransformAnimation();
    setZoom(100);
    setPan(newPan);
  }, [triggerTransformAnimation, commitViewport]);

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
    if (paintFrameRef.current) armWheelCommit();
  }, [canvasRef, maxZoom, minZoom, scheduleFlush, armWheelCommit]);

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

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (paintFrameRef.current) commitViewport();
  }, [commitViewport]);

  const handleContextMenu = useCallback((e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-canvas-node]')) return;
    e.preventDefault();
  }, []);

  const { handleTouchStart, handleTouchMove, handleTouchEnd: endTouch } = useTouchGestures({
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

  /** После жеста пальцем фиксируем камеру в состоянии React */
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    endTouch(e);
    if (e.touches.length === 0 && paintFrameRef.current) commitViewport();
  }, [endTouch, commitViewport]);

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
    const onUp = () => {
      setIsPanning(false);
      if (paintFrameRef.current) commitViewport();
    };
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
  }, [isPanning, panStart, lastPanPosition, scheduleFlush, commitViewport]);

  return {
    pan,
    zoom,
    setPan,
    setZoom,
    panRef,
    zoomRef,
    isPanning,
    viewportLiveRef,
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
