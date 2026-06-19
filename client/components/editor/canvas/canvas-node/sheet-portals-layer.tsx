/**
 * @fileoverview Слой исходящих порталов на холсте
 *
 * Рендерит все порталы к другим листам и рисует пунктирные SVG-линии
 * от нод-источников к соответствующим порталам.
 *
 * @module canvas-node/sheet-portals-layer
 */

import { useMemo } from 'react';
import { Node } from '@/types/bot';
import { SheetPortal } from '../canvas/utils/collect-cross-sheet-links';
import { SheetPortalNode } from './sheet-portal-node';
import { computePortalPositions, computePortalLines } from './sheet-portal-positions';

/** Размер SVG-холста */
const SVG_SIZE = 20000;

/**
 * Свойства слоя порталов
 */
interface SheetPortalsLayerProps {
  /** Массив порталов для отображения */
  portals: SheetPortal[];
  /** Ноды текущего листа */
  nodes: Node[];
  /** Карта реальных размеров нод */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Колбэк навигации на другой лист (одиночный клик) */
  onNavigate: (sheetId: string) => void;
  /** Колбэк навигации к целевой ноде с фокусом (двойной клик) */
  onNavigateNode?: (targetNodeId: string) => void;
}

/**
 * Слой исходящих порталов с SVG-линиями от нод-источников
 *
 * @param props - Свойства компонента
 * @returns JSX элемент слоя порталов
 */
export function SheetPortalsLayer({ portals, nodes, nodeSizes, onNavigate, onNavigateNode }: SheetPortalsLayerProps) {
  /** Позиции порталов */
  const portalPositions = useMemo(
    () => computePortalPositions(portals, nodes, nodeSizes),
    [portals, nodes, nodeSizes],
  );

  /** Линии от нод-источников к порталам */
  const lines = useMemo(
    () => computePortalLines(portals, portalPositions, nodes, nodeSizes),
    [portals, portalPositions, nodes, nodeSizes],
  );

  if (portals.length === 0) return null;

  return (
    <>
      {/* SVG-слой пунктирных линий к порталам */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SVG_SIZE,
          height: SVG_SIZE,
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 4,
        }}
      >
        {lines.map(({ key, x1, y1, x2, y2 }) => {
          const dx = Math.abs(x2 - x1);
          const curve = Math.max(60, dx * 0.4);
          const d = `M ${x1},${y1} C ${x1 + curve},${y1} ${x2 - curve},${y2} ${x2},${y2}`;

          return (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#a855f7"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
          );
        })}
      </svg>

      {/* Порталы-ноды */}
      {portals.map(portal => {
        const pos = portalPositions.get(portal.sheetId);
        if (!pos) return null;
        return (
          <SheetPortalNode
            key={portal.sheetId}
            portal={portal}
            position={pos}
            onNavigateSheet={onNavigate}
            onNavigateNode={onNavigateNode}
          />
        );
      })}
    </>
  );
}
