import { useMemo } from 'react';
import { Connection, Node } from '@/types/bot';
import { cn } from '@/lib/utils';

interface ConnectionLineProps {
  connection: Connection;
  nodes: Node[];
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ConnectionLine({ connection, nodes, isSelected, onClick, onDelete }: ConnectionLineProps) {
  const { path, midPoint } = useMemo(() => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      return { path: '', midPoint: { x: 0, y: 0 } };
    }

    // Размеры узла (из CanvasNode)
    const nodeWidth = 320; // 80 * 4 = 320px (w-80)
    const nodeHeight = 200; // примерная высота узла

    // Позиции точек соединения
    const sourceX = sourceNode.position.x + nodeWidth + 8; // правая точка (8px offset)
    const sourceY = sourceNode.position.y + nodeHeight / 2;
    const targetX = targetNode.position.x - 8; // левая точка (8px offset)
    const targetY = targetNode.position.y + nodeHeight / 2;

    // Создаем curved path (Безье кривая)
    const controlPointOffset = Math.min(Math.abs(targetX - sourceX) / 2, 100);
    const controlPoint1X = sourceX + controlPointOffset;
    const controlPoint1Y = sourceY;
    const controlPoint2X = targetX - controlPointOffset;
    const controlPoint2Y = targetY;

    const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
    
    // Средняя точка для кнопки удаления
    const midPoint = {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2
    };

    return { path, midPoint };
  }, [connection, nodes]);

  if (!path) return null;

  return (
    <g className="connection-line">
      {/* Невидимая толстая линия для удобства клика */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="cursor-pointer"
        onClick={onClick}
      />
      
      {/* Основная линия */}
      <path
        d={path}
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        className={cn(
          "transition-all duration-200",
          isSelected ? "drop-shadow-lg" : "hover:stroke-primary/70"
        )}
        style={{
          strokeDasharray: isSelected ? "none" : "none"
        }}
        onClick={onClick}
      />

      {/* Стрелка */}
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
            className="transition-all duration-200"
          />
        </marker>
      </defs>
      
      <path
        d={path}
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        markerEnd={`url(#arrowhead-${connection.id})`}
        className={cn(
          "transition-all duration-200",
          isSelected ? "drop-shadow-lg" : "hover:stroke-primary/70"
        )}
        onClick={onClick}
      />

      {/* Кнопка удаления */}
      {isSelected && onDelete && (
        <foreignObject
          x={midPoint.x - 12}
          y={midPoint.y - 12}
          width="24"
          height="24"
          className="pointer-events-none"
        >
          <button
            className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white dark:border-slate-900 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </foreignObject>
      )}
    </g>
  );
}