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
      return { path: '', midPoint: { x: 0, y: 0 }, distance: 0 };
    }

    // Динамические размеры узла на основе содержимого
    const baseWidth = 320; // Базовая ширина
    const baseHeight = 200; // Базовая высота
    
    // Добавляем высоту для кнопок
    const sourceButtonHeight = sourceNode.data.buttons.length > 0 ? 
      (sourceNode.data.keyboardType === 'inline' ? 
        Math.ceil(sourceNode.data.buttons.length / 2) * 50 : 
        sourceNode.data.buttons.length * 40) : 0;
    
    const targetButtonHeight = targetNode.data.buttons.length > 0 ? 
      (targetNode.data.keyboardType === 'inline' ? 
        Math.ceil(targetNode.data.buttons.length / 2) * 50 : 
        targetNode.data.buttons.length * 40) : 0;

    const sourceHeight = baseHeight + sourceButtonHeight;
    const targetHeight = baseHeight + targetButtonHeight;

    // Умное позиционирование точек соединения
    const sourceX = sourceNode.position.x + baseWidth + 8;
    const sourceY = sourceNode.position.y + sourceHeight / 2;
    const targetX = targetNode.position.x - 8;
    const targetY = targetNode.position.y + targetHeight / 2;

    // Прямая линия
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    
    // Средняя точка прямой линии
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const midPoint = { x: midX, y: midY };

    return { path, midPoint, distance };
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
          "transition-all duration-300",
          isSelected ? "drop-shadow-lg" : "hover:stroke-primary/70"
        )}
        style={{
          strokeDasharray: isSelected ? "none" : "none",
          filter: isSelected ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.3))" : "none"
        }}
        onClick={onClick}
      />

      {/* Анимированная линия для визуального эффекта */}
      {isSelected && (
        <path
          d={path}
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          fill="none"
          className="animate-pulse opacity-60"
          style={{
            strokeDasharray: "8 4",
            animation: "dash 2s linear infinite"
          }}
        />
      )}

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