/**
 * @fileoverview Вычисление позиций порталов и SVG-линий
 *
 * Утилита позиционирует порталы справа от всех нод текущего листа
 * и строит массив линий от нод-источников к порталам.
 *
 * @module canvas-node/sheet-portal-positions
 */

import { Node } from '@/types/bot';
import { SheetPortal } from '../canvas/utils/collect-cross-sheet-links';

/** Отступ от крайней правой ноды до столбца порталов */
const PORTAL_OFFSET_X = 250;

/** Вертикальный отступ между порталами */
const PORTAL_GAP_Y = 250;

/** Высота портала (приблизительная для вычисления центра) */
export const PORTAL_HEIGHT = 192;

/**
 * Одна SVG-линия от ноды-источника к порталу
 */
export interface PortalLine {
  /** Уникальный ключ для React */
  key: string;
  /** X начала (правый край ноды-источника) */
  x1: number;
  /** Y начала (середина ноды-источника) */
  y1: number;
  /** X конца (левый край портала) */
  x2: number;
  /** Y конца (середина портала) */
  y2: number;
}

/**
 * Вычисляет позиции порталов справа от всех нод текущего листа
 *
 * @param portals - Порталы для позиционирования
 * @param nodes - Ноды текущего листа
 * @param nodeSizes - Карта реальных размеров нод
 * @returns Map sheetId → { x, y }
 */
export function computePortalPositions(
  portals: SheetPortal[],
  nodes: Node[],
  nodeSizes: Map<string, { width: number; height: number }>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (portals.length === 0 || nodes.length === 0) return positions;

  // Находим правую границу и среднюю Y всех нод
  let maxRight = 0;
  let avgY = 0;
  for (const node of nodes) {
    const w = nodeSizes.get(node.id)?.width ?? 320;
    const right = node.position.x + w;
    if (right > maxRight) maxRight = right;
    avgY += node.position.y;
  }
  avgY = avgY / nodes.length;

  const portalX = maxRight + PORTAL_OFFSET_X;
  const totalHeight = portals.length * PORTAL_HEIGHT + (portals.length - 1) * (PORTAL_GAP_Y - PORTAL_HEIGHT);
  const startY = avgY - totalHeight / 2;

  portals.forEach((portal, index) => {
    positions.set(portal.sheetId, {
      x: portalX,
      y: startY + index * PORTAL_GAP_Y,
    });
  });

  return positions;
}

/**
 * Строит массив SVG-линий от нод-источников к порталам
 *
 * @param portals - Порталы
 * @param portalPositions - Позиции порталов
 * @param nodes - Ноды текущего листа
 * @param nodeSizes - Карта реальных размеров нод
 * @returns Массив линий
 */
export function computePortalLines(
  portals: SheetPortal[],
  portalPositions: Map<string, { x: number; y: number }>,
  nodes: Node[],
  nodeSizes: Map<string, { width: number; height: number }>,
): PortalLine[] {
  const result: PortalLine[] = [];

  for (const portal of portals) {
    const portalPos = portalPositions.get(portal.sheetId);
    if (!portalPos) continue;

    const targetX = portalPos.x;
    const targetY = portalPos.y + PORTAL_HEIGHT / 2;

    for (const link of portal.links) {
      const sourceNode = nodes.find(n => n.id === link.sourceNodeId);
      if (!sourceNode) continue;

      const sourceSize = nodeSizes.get(link.sourceNodeId);
      const sourceW = sourceSize?.width ?? 320;
      const sourceH = sourceSize?.height ?? 120;

      result.push({
        key: `${link.sourceNodeId}->${portal.sheetId}-${link.connectionType}`,
        x1: sourceNode.position.x + sourceW,
        y1: sourceNode.position.y + sourceH / 2,
        x2: targetX,
        y2: targetY,
      });
    }
  }

  return result;
}

/** Ширина портала (соответствует w-[576px] в CSS) */
const PORTAL_WIDTH = 576;

/**
 * Вычисляет позиции ВХОДЯЩИХ порталов — слева от всех нод текущего листа
 *
 * @param portals - Входящие порталы для позиционирования
 * @param nodes - Ноды текущего листа
 * @returns Map sheetId → { x, y }
 */
export function computeIncomingPortalPositions(
  portals: SheetPortal[],
  nodes: Node[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (portals.length === 0 || nodes.length === 0) return positions;

  // Находим левую границу и среднюю Y всех нод
  let minLeft = Infinity;
  let avgY = 0;
  for (const node of nodes) {
    if (node.position.x < minLeft) minLeft = node.position.x;
    avgY += node.position.y;
  }
  avgY = avgY / nodes.length;

  const portalX = minLeft - PORTAL_OFFSET_X - PORTAL_WIDTH;
  const totalHeight = portals.length * PORTAL_HEIGHT + (portals.length - 1) * (PORTAL_GAP_Y - PORTAL_HEIGHT);
  const startY = avgY - totalHeight / 2;

  portals.forEach((portal, index) => {
    positions.set(portal.sheetId, {
      x: portalX,
      y: startY + index * PORTAL_GAP_Y,
    });
  });

  return positions;
}

/**
 * Строит массив SVG-линий от ВХОДЯЩИХ порталов к целевым нодам на текущем листе.
 * Линия идёт от правого края портала к левому краю целевой ноды.
 *
 * @param portals - Входящие порталы
 * @param portalPositions - Позиции порталов
 * @param nodes - Ноды текущего листа
 * @returns Массив линий
 */
export function computeIncomingPortalLines(
  portals: SheetPortal[],
  portalPositions: Map<string, { x: number; y: number }>,
  nodes: Node[],
  nodeSizes: Map<string, { width: number; height: number }>,
): PortalLine[] {
  const result: PortalLine[] = [];

  for (const portal of portals) {
    const portalPos = portalPositions.get(portal.sheetId);
    if (!portalPos) continue;

    // Правый край портала
    const sourceX = portalPos.x + PORTAL_WIDTH;
    const sourceY = portalPos.y + PORTAL_HEIGHT / 2;

    for (const link of portal.links) {
      // Целевая нода — на текущем листе
      const targetNode = nodes.find(n => n.id === link.targetNodeId);
      if (!targetNode) continue;

      const targetH = nodeSizes.get(link.targetNodeId)?.height ?? 120;

      result.push({
        key: `incoming-${portal.sheetId}->${link.targetNodeId}-${link.connectionType}`,
        x1: sourceX,
        y1: sourceY,
        x2: targetNode.position.x,
        y2: targetNode.position.y + targetH / 2,
      });
    }
  }

  return result;
}
