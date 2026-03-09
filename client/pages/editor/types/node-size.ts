/**
 * @fileoverview Типы размеров узлов
 *
 * Используется для иерархического layout в редакторе.
 */

/** Размеры узла для иерархического layout */
export interface NodeSize {
  /** Ширина узла в пикселях */
  width: number;
  /** Высота узла в пикселях */
  height: number;
}

/** Карта размеров узлов */
export type NodeSizeMap = Map<string, NodeSize>;
