/**
 * @fileoverview SVG-слой временного соединения при drag-to-connect
 *
 * Рисует линию от порта выхода до текущей позиции курсора во время drag.
 * Встраивается в CanvasContent рядом с ConnectionsLayer.
 *
 * @module draft-connection-layer
 */

import { DraftConnection } from '../canvas/use-connection-drag';
import { PORT_COLORS } from './port-colors';

/** Размер SVG-холста */
const SVG_SIZE = 20000;

interface DraftConnectionLayerProps {
  /** Текущее временное соединение (null если не тянем) */
  draftConnection: DraftConnection | null;
}

/**
 * Компонент SVG-слоя временного соединения
 *
 * @param props - Пропсы компонента
 * @returns SVG-элемент или null
 */
export function DraftConnectionLayer({ draftConnection }: DraftConnectionLayerProps) {
  if (!draftConnection) return null;

  const { startX, startY, currentX, currentY, portType } = draftConnection;
  const color = PORT_COLORS[portType];

  // Кривая Безье от старта до курсора
  const dx = currentX - startX;
  const curve = Math.max(60, Math.abs(dx) * 0.5);
  const d = `M ${startX},${startY} C ${startX + curve},${startY} ${currentX - curve},${currentY} ${currentX},${currentY}`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SVG_SIZE,
        height: SVG_SIZE,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 50,
      }}
    >
      <defs>
        <marker
          id="draft-arrow"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} opacity={0.9} />
        </marker>
      </defs>
      {/* Тень */}
      <path d={d} fill="none" stroke={color} strokeWidth={4} strokeOpacity={0.15} strokeDasharray="8 5" />
      {/* Основная линия */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.9}
        strokeDasharray="8 5"
        markerEnd="url(#draft-arrow)"
      />
    </svg>
  );
}
