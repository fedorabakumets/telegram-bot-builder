/**
 * @fileoverview Слой ВХОДЯЩИХ порталов на холсте
 *
 * Рендерит входящие порталы (ноды с других листов, ведущие к нодам текущего листа)
 * и рисует пунктирные SVG-линии от порталов к целевым нодам.
 * Цвет оформления — бирюзовый (#14b8a6), отличается от фиолетового исходящих.
 *
 * @module canvas-node/incoming-sheet-portals-layer
 */

import { useMemo } from 'react';
import { Node } from '@/types/bot';
import { SheetPortal } from '../canvas/utils/collect-cross-sheet-links';
import { IncomingSheetPortalNode } from './incoming-sheet-portal-node';
import { computeIncomingPortalPositions, computeIncomingPortalLines } from './sheet-portal-positions';

/** Размер SVG-холста */
const SVG_SIZE = 20000;

/**
 * Свойства слоя входящих порталов
 */
interface IncomingSheetPortalsLayerProps {
  /** Массив входящих порталов для отображения */
  portals: SheetPortal[];
  /** Ноды текущего листа */
  nodes: Node[];
  /** Карта реальных размеров нод */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Колбэк навигации на исходный лист (одиночный клик) */
  onNavigate: (sheetId: string) => void;
  /** Колбэк навигации к ноде-источнику с фокусом (двойной клик) */
  onNavigateNode?: (sourceNodeId: string) => void;
}

/**
 * Слой входящих порталов с SVG-линиями к целевым нодам
 *
 * @param props - Свойства компонента
 * @returns JSX элемент слоя входящих порталов
 */
export function IncomingSheetPortalsLayer({ portals, nodes, nodeSizes, onNavigate, onNavigateNode }: IncomingSheetPortalsLayerProps) {
  /** Позиции входящих порталов (слева от нод) */
  const portalPositions = useMemo(
    () => computeIncomingPortalPositions(portals, nodes),
    [portals, nodes],
  );

  /** Линии от порталов к целевым нодам */
  const lines = useMemo(
    () => computeIncomingPortalLines(portals, portalPositions, nodes, nodeSizes),
    [portals, portalPositions, nodes, nodeSizes],
  );

  if (portals.length === 0) return null;

  return (
    <>
      {/* SVG-слой пунктирных линий от входящих порталов */}
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
              stroke="#14b8a6"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
          );
        })}
      </svg>

      {/* Входящие порталы */}
      {portals.map(portal => {
        const pos = portalPositions.get(portal.sheetId);
        if (!pos) return null;
        return (
          <IncomingSheetPortalNode
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
