/**
 * @fileoverview Кастомные скроллбары для холста редактора
 *
 * Реализует вертикальный и горизонтальный скроллбары, которые
 * визуально отображают текущую позицию pan на бесконечном холсте
 * и позволяют перетаскивать thumb для изменения pan.
 */

import { useRef, useCallback, useEffect, useState } from 'react';

/** Размер видимой области холста в canvas-координатах (условные единицы) */
const CANVAS_VIRTUAL_SIZE = 20000;

/** Ширина/высота скроллбара в пикселях */
const SCROLLBAR_SIZE = 12;

/** Минимальный размер thumb в пикселях */
const THUMB_MIN_SIZE = 40;

/**
 * Свойства компонента кастомных скроллбаров
 */
interface CanvasScrollbarsProps {
  /** Текущий pan по X */
  panX: number;
  /** Текущий pan по Y */
  panY: number;
  /** Текущий масштаб в процентах */
  zoom: number;
  /** Ширина видимой области холста в пикселях */
  viewportWidth: number;
  /** Высота видимой области холста в пикселях */
  viewportHeight: number;
  /** Колбэк изменения pan */
  onPanChange: (pan: { x: number; y: number }) => void;
}

/**
 * Вычисляет размер и позицию thumb скроллбара
 *
 * @param viewportPx - размер видимой области в пикселях
 * @param panPx - текущий pan в пикселях
 * @param zoom - масштаб в процентах
 * @param trackPx - размер трека скроллбара в пикселях
 * @returns объект с размером и позицией thumb
 */
function computeThumb(viewportPx: number, panPx: number, zoom: number, trackPx: number) {
  const zoomFactor = zoom / 100;
  // Размер видимой области в canvas-координатах
  const visibleCanvas = viewportPx / zoomFactor;
  // Соотношение видимого к виртуальному размеру
  const ratio = Math.min(visibleCanvas / CANVAS_VIRTUAL_SIZE, 1);
  const thumbSize = Math.max(trackPx * ratio, THUMB_MIN_SIZE);

  // Позиция: pan.x = 0 означает что мы смотрим на начало холста
  // Центрируем: виртуальный холст начинается с -CANVAS_VIRTUAL_SIZE/2
  const half = CANVAS_VIRTUAL_SIZE / 2;
  // Позиция левого края видимой области в canvas-координатах
  const canvasLeft = -panPx / zoomFactor;
  // Нормализуем в диапазон [0, 1]
  const scrollRatio = (canvasLeft + half) / CANVAS_VIRTUAL_SIZE;
  const thumbPos = Math.max(0, Math.min(scrollRatio * trackPx, trackPx - thumbSize));

  return { thumbSize, thumbPos };
}

/**
 * Компонент кастомных скроллбаров холста
 *
 * @param props - свойства компонента
 * @returns JSX элемент со скроллбарами
 */
export function CanvasScrollbars({
  panX,
  panY,
  zoom,
  viewportWidth,
  viewportHeight,
  onPanChange,
}: CanvasScrollbarsProps) {
  /** Ref вертикального трека */
  const vTrackRef = useRef<HTMLDivElement>(null);
  /** Ref горизонтального трека */
  const hTrackRef = useRef<HTMLDivElement>(null);

  /** Состояние drag вертикального thumb */
  const [vDragging, setVDragging] = useState(false);
  /** Состояние drag горизонтального thumb */
  const [hDragging, setHDragging] = useState(false);

  /** Начальная позиция мыши при drag */
  const dragStart = useRef({ mousePos: 0, panValue: 0 });

  const vTrackSize = viewportHeight;
  const hTrackSize = viewportWidth;

  const { thumbSize: vThumbSize, thumbPos: vThumbPos } = computeThumb(viewportHeight, panY, zoom, vTrackSize);
  const { thumbSize: hThumbSize, thumbPos: hThumbPos } = computeThumb(viewportWidth, panX, zoom, hTrackSize);

  /**
   * Конвертирует смещение thumb в новый pan
   */
  const thumbOffsetToPan = useCallback((
    offsetPx: number,
    trackPx: number,
    thumbSizePx: number,
    viewportPx: number,
  ) => {
    const zoomFactor = zoom / 100;
    const half = CANVAS_VIRTUAL_SIZE / 2;
    const scrollRatio = offsetPx / (trackPx - thumbSizePx);
    const canvasLeft = scrollRatio * CANVAS_VIRTUAL_SIZE - half;
    return -canvasLeft * zoomFactor;
  }, [zoom]);

  /** Начало drag вертикального thumb */
  const handleVMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVDragging(true);
    dragStart.current = { mousePos: e.clientY, panValue: panY };
  }, [panY]);

  /** Начало drag горизонтального thumb */
  const handleHMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHDragging(true);
    dragStart.current = { mousePos: e.clientX, panValue: panX };
  }, [panX]);

  /** Клик по вертикальному треку (прыжок к позиции) */
  const handleVTrackClick = useCallback((e: React.MouseEvent) => {
    if (!vTrackRef.current) return;
    const rect = vTrackRef.current.getBoundingClientRect();
    const clickPos = e.clientY - rect.top - vThumbSize / 2;
    const newPanY = thumbOffsetToPan(
      Math.max(0, Math.min(clickPos, vTrackSize - vThumbSize)),
      vTrackSize, vThumbSize, viewportHeight
    );
    onPanChange({ x: panX, y: newPanY });
  }, [vThumbSize, vTrackSize, viewportHeight, panX, thumbOffsetToPan, onPanChange]);

  /** Клик по горизонтальному треку (прыжок к позиции) */
  const handleHTrackClick = useCallback((e: React.MouseEvent) => {
    if (!hTrackRef.current) return;
    const rect = hTrackRef.current.getBoundingClientRect();
    const clickPos = e.clientX - rect.left - hThumbSize / 2;
    const newPanX = thumbOffsetToPan(
      Math.max(0, Math.min(clickPos, hTrackSize - hThumbSize)),
      hTrackSize, hThumbSize, viewportWidth
    );
    onPanChange({ x: newPanX, y: panY });
  }, [hThumbSize, hTrackSize, viewportWidth, panY, thumbOffsetToPan, onPanChange]);

  /** Глобальный mousemove/mouseup для drag */
  useEffect(() => {
    if (!vDragging && !hDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (vDragging && vTrackRef.current) {
        const delta = e.clientY - dragStart.current.mousePos;
        const newOffset = vThumbPos + delta;
        const newPanY = thumbOffsetToPan(
          Math.max(0, Math.min(newOffset, vTrackSize - vThumbSize)),
          vTrackSize, vThumbSize, viewportHeight
        );
        onPanChange({ x: panX, y: newPanY });
      }
      if (hDragging && hTrackRef.current) {
        const delta = e.clientX - dragStart.current.mousePos;
        const newOffset = hThumbPos + delta;
        const newPanX = thumbOffsetToPan(
          Math.max(0, Math.min(newOffset, hTrackSize - hThumbSize)),
          hTrackSize, hThumbSize, viewportWidth
        );
        onPanChange({ x: newPanX, y: panY });
      }
    };

    const handleMouseUp = () => {
      setVDragging(false);
      setHDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    vDragging, hDragging,
    vThumbPos, hThumbPos,
    vThumbSize, hThumbSize,
    vTrackSize, hTrackSize,
    viewportHeight, viewportWidth,
    panX, panY,
    thumbOffsetToPan, onPanChange,
  ]);

  return (
    <>
      {/* Вертикальный скроллбар */}
      <div
        ref={vTrackRef}
        className="absolute right-0 top-0 bottom-0 z-50 cursor-pointer"
        style={{ width: SCROLLBAR_SIZE, bottom: SCROLLBAR_SIZE }}
        onClick={handleVTrackClick}
      >
        {/* Трек */}
        <div className="absolute inset-0 bg-slate-200/40 dark:bg-slate-800/40 rounded-full" />
        {/* Thumb */}
        <div
          className="absolute right-0 left-0 rounded-full bg-slate-400/70 dark:bg-slate-500/70 hover:bg-slate-500/90 dark:hover:bg-slate-400/90 transition-colors cursor-grab active:cursor-grabbing"
          style={{ top: vThumbPos, height: vThumbSize }}
          onMouseDown={handleVMouseDown}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Горизонтальный скроллбар */}
      <div
        ref={hTrackRef}
        className="absolute bottom-0 left-0 right-0 z-50 cursor-pointer"
        style={{ height: SCROLLBAR_SIZE, right: SCROLLBAR_SIZE }}
        onClick={handleHTrackClick}
      >
        {/* Трек */}
        <div className="absolute inset-0 bg-slate-200/40 dark:bg-slate-800/40 rounded-full" />
        {/* Thumb */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-slate-400/70 dark:bg-slate-500/70 hover:bg-slate-500/90 dark:hover:bg-slate-400/90 transition-colors cursor-grab active:cursor-grabbing"
          style={{ left: hThumbPos, width: hThumbSize }}
          onMouseDown={handleHMouseDown}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Угловой квадрат между скроллбарами */}
      <div
        className="absolute bottom-0 right-0 z-50 bg-slate-200/40 dark:bg-slate-800/40"
        style={{ width: SCROLLBAR_SIZE, height: SCROLLBAR_SIZE }}
      />
    </>
  );
}
