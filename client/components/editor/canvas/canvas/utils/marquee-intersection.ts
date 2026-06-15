/**
 * @fileoverview Геометрия рамки выделения (marquee) и проверка пересечения с узлами холста
 * @module canvas/marquee-intersection
 */

/** Прямоугольник рамки выделения в screen-координатах относительно холста */
export interface MarqueeRect {
  /** X точки начала рамки (где нажали мышь) */
  startX: number;
  /** Y точки начала рамки (где нажали мышь) */
  startY: number;
  /** Текущий X курсора */
  currentX: number;
  /** Текущий Y курсора */
  currentY: number;
}

/** Минимальное описание узла для проверки пересечения */
export interface MarqueeNode {
  /** Идентификатор узла */
  id: string;
  /** Позиция узла в координатах холста */
  position: { x: number; y: number };
}

/** Ширина узла по умолчанию, если реальный размер ещё не измерен */
const DEFAULT_NODE_WIDTH = 320;
/** Высота узла по умолчанию, если реальный размер ещё не измерен */
const DEFAULT_NODE_HEIGHT = 200;

/**
 * Переводит screen-координату холста в координату холста.
 * Формула: (screen - pan) / (zoom / 100)
 *
 * @param value - Координата в screen-пространстве холста
 * @param panValue - Смещение холста по соответствующей оси
 * @param zoom - Текущий масштаб в процентах
 * @returns Координата в пространстве холста
 */
function toCanvasCoord(value: number, panValue: number, zoom: number): number {
  return (value - panValue) / (zoom / 100);
}

/**
 * Вычисляет множество ID узлов, чьи bounding box пересекаются с рамкой.
 *
 * @param rect - Прямоугольник рамки в screen-координатах холста
 * @param nodes - Массив узлов с позициями
 * @param nodeSizes - Карта реальных размеров узлов
 * @param pan - Текущее смещение холста
 * @param zoom - Текущий масштаб в процентах
 * @returns Set идентификаторов попавших в рамку узлов
 */
export function getNodesInMarquee(
  rect: MarqueeRect,
  nodes: MarqueeNode[],
  nodeSizes: Map<string, { width: number; height: number }>,
  pan: { x: number; y: number },
  zoom: number,
): Set<string> {
  // Переводим углы рамки в координаты холста и нормализуем (min/max)
  const x1 = toCanvasCoord(Math.min(rect.startX, rect.currentX), pan.x, zoom);
  const x2 = toCanvasCoord(Math.max(rect.startX, rect.currentX), pan.x, zoom);
  const y1 = toCanvasCoord(Math.min(rect.startY, rect.currentY), pan.y, zoom);
  const y2 = toCanvasCoord(Math.max(rect.startY, rect.currentY), pan.y, zoom);

  const result = new Set<string>();
  for (const node of nodes) {
    const size = nodeSizes.get(node.id);
    const w = size?.width ?? DEFAULT_NODE_WIDTH;
    const h = size?.height ?? DEFAULT_NODE_HEIGHT;
    const left = node.position.x;
    const right = node.position.x + w;
    const top = node.position.y;
    const bottom = node.position.y + h;

    // Проверка пересечения двух прямоугольников
    const intersects = left <= x2 && right >= x1 && top <= y2 && bottom >= y1;
    if (intersects) result.add(node.id);
  }
  return result;
}
