import { useMemo } from 'react';
import { Node } from '@/types/bot';

interface TemporaryConnectionProps {
  startNode: Node;
  endPosition: { x: number; y: number };
  handle: 'source' | 'target';
}

export function TemporaryConnection({ startNode, endPosition, handle }: TemporaryConnectionProps) {
  const path = useMemo(() => {
    const baseWidth = 320;
    const baseHeight = 200;
    
    const buttonHeight = startNode.data.buttons.length > 0 ? 
      (startNode.data.keyboardType === 'inline' ? 
        Math.ceil(startNode.data.buttons.length / 2) * 50 : 
        startNode.data.buttons.length * 40) : 0;

    const nodeHeight = baseHeight + buttonHeight;

    // Позиции точек соединения
    const startX = handle === 'source' ? 
      startNode.position.x + baseWidth + 8 : 
      startNode.position.x - 8;
    const startY = startNode.position.y + nodeHeight / 2;
    const endX = endPosition.x;
    const endY = endPosition.y;

    // Адаптивная кривая Безье с меньшей кривизной
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Уменьшаем offset для более прямой линии
    let controlPointOffset = Math.min(Math.abs(deltaX) / 4, Math.max(30, distance * 0.15));
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      controlPointOffset = Math.max(controlPointOffset, 50);
    }

    const controlPoint1X = startX + (handle === 'source' ? controlPointOffset : -controlPointOffset);
    const controlPoint1Y = startY;
    const controlPoint2X = endX + (handle === 'source' ? -controlPointOffset : controlPointOffset);
    const controlPoint2Y = endY;

    return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  }, [startNode, endPosition, handle]);

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 1000,
        overflow: 'visible'
      }}
    >
      <defs>
        <marker
          id="temp-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(var(--primary))"
            className="opacity-70"
          />
        </marker>
      </defs>

      {/* Временная линия соединения */}
      <path
        d={path}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        fill="none"
        className="opacity-70"
        style={{
          strokeDasharray: "8 4",
          animation: "dash 1s linear infinite"
        }}
        markerEnd="url(#temp-arrowhead)"
      />

      {/* Анимированный эффект */}
      <path
        d={path}
        stroke="hsl(var(--primary))"
        strokeWidth="1"
        fill="none"
        className="opacity-30"
        style={{
          strokeDasharray: "4 8",
          animation: "dash 1.5s linear infinite reverse"
        }}
      />
    </svg>
  );
}