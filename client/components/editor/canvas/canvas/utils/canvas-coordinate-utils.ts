/**
 * @fileoverview Утилиты для перевода экранных координат canvas-редактора в координаты холста
 *
 * Используются для drag нод, drag-to-connect и других взаимодействий, где нужно учитывать
 * scroll контейнера, pan и zoom.
 *
 * @module canvas-coordinate-utils
 */

/** Параметры видимой области canvas */
export interface CanvasViewportMetrics {
  /** Левый край viewport в экранных координатах */
  left: number;
  /** Верхний край viewport в экранных координатах */
  top: number;
  /** Горизонтальный scroll контейнера */
  scrollLeft: number;
  /** Вертикальный scroll контейнера */
  scrollTop: number;
}

/**
 * Возвращает метрики viewport canvas.
 *
 * @param container - Scroll контейнер холста
 * @returns Метрики viewport или `null`, если контейнер недоступен
 */
export function getCanvasViewportMetrics(container: HTMLElement | null | undefined): CanvasViewportMetrics | null {
  if (!container) return null;
  const rect = container.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    scrollLeft: container.scrollLeft,
    scrollTop: container.scrollTop,
  };
}

/**
 * Переводит экранную точку в координаты canvas.
 *
 * @param screenX - X в экранных координатах
 * @param screenY - Y в экранных координатах
 * @param viewport - Метрики viewport canvas
 * @param pan - Текущий pan
 * @param zoom - Текущий zoom в процентах
 * @returns Точка в координатах canvas
 */
export function screenPointToCanvasPoint(
  screenX: number,
  screenY: number,
  viewport: CanvasViewportMetrics,
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  const scale = zoom / 100;
  return {
    x: (screenX - viewport.left + viewport.scrollLeft - pan.x) / scale,
    y: (screenY - viewport.top + viewport.scrollTop - pan.y) / scale,
  };
}
