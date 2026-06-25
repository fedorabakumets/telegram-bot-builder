/**
 * @fileoverview Расчёт готовности размеров узлов для авто-FIT камеры.
 *
 * Авто-FIT вписывает сценарий листа в экран по границам узлов. Границы
 * считаются корректно только когда реальные размеры узлов уже измерены
 * (ResizeObserver наполнил карту nodeSizes). Если вписать «вслепую» по
 * fallback-размеру 320×200 — камера промахивается и прыгает. Эти хелперы
 * определяют, достаточно ли узлов измерено, чтобы запускать вписывание.
 */

import { Node } from '@/types/bot';

/** Доля измеренных узлов, при которой границы считаются достаточно точными */
export const NODE_SIZES_READY_RATIO = 0.5;

/**
 * Считает количество узлов, для которых уже известны реальные размеры.
 *
 * @param nodes - Узлы текущего листа.
 * @param nodeSizes - Карта измеренных размеров узлов (id → размеры).
 * @returns Количество узлов с измеренными размерами.
 */
export function countMeasuredNodes(
  nodes: Node[],
  nodeSizes: Map<string, { width: number; height: number }>,
): number {
  return nodes.reduce((count, node) => (nodeSizes.has(node.id) ? count + 1 : count), 0);
}

/**
 * Проверяет, измерено ли достаточно узлов для корректного вписывания камеры.
 *
 * @param nodes - Узлы текущего листа.
 * @param nodeSizes - Карта измеренных размеров узлов (id → размеры).
 * @param ratio - Минимальная доля измеренных узлов (по умолчанию 50%).
 * @returns `true`, если измерено не меньше требуемой доли узлов.
 */
export function areNodeSizesReady(
  nodes: Node[],
  nodeSizes: Map<string, { width: number; height: number }>,
  ratio: number = NODE_SIZES_READY_RATIO,
): boolean {
  if (nodes.length === 0) return false;
  const measured = countMeasuredNodes(nodes, nodeSizes);
  return measured >= Math.ceil(nodes.length * ratio);
}

/**
 * Строит стабильный ключ набора узлов листа для детекции смены состава.
 *
 * @param nodes - Узлы текущего листа.
 * @returns Строковый ключ из идентификаторов узлов.
 */
export function buildNodesKey(nodes: Node[]): string {
  return nodes.map(n => n.id).join(',');
}
