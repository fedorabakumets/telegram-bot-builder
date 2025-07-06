import { useMemo } from 'react';
import { Connection, Node } from '@/types/bot';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Mouse, 
  Terminal, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';

interface EnhancedConnectionLineProps {
  connection: Connection;
  nodes: Node[];
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  showButtonInfo?: boolean;
}

export function EnhancedConnectionLine({ 
  connection, 
  nodes, 
  isSelected, 
  onClick, 
  onDelete,
  showButtonInfo = true
}: EnhancedConnectionLineProps) {
  const { path, midPoint, distance, buttonInfo, hasButton } = useMemo(() => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      return { 
        path: '', 
        midPoint: { x: 0, y: 0 }, 
        distance: 0, 
        buttonInfo: null, 
        hasButton: false 
      };
    }

    // Расчет позиций узлов
    const baseWidth = 320;
    const baseHeight = 200;
    
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

    // Позиции точек соединения
    const sourceX = sourceNode.position.x + baseWidth + 8;
    const sourceY = sourceNode.position.y + sourceHeight / 2;
    const targetX = targetNode.position.x - 8;
    const targetY = targetNode.position.y + targetHeight / 2;

    // Расчет кривой Безье
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let controlPointOffset = Math.min(Math.abs(deltaX) / 2, Math.max(80, distance * 0.3));
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      controlPointOffset = Math.max(controlPointOffset, 120);
    }

    const controlPoint1X = sourceX + controlPointOffset;
    const controlPoint1Y = sourceY;
    const controlPoint2X = targetX - controlPointOffset;
    const controlPoint2Y = targetY;

    const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
    
    // Средняя точка кривой
    const t = 0.5;
    const midX = Math.pow(1-t, 3) * sourceX + 3 * Math.pow(1-t, 2) * t * controlPoint1X + 3 * (1-t) * Math.pow(t, 2) * controlPoint2X + Math.pow(t, 3) * targetX;
    const midY = Math.pow(1-t, 3) * sourceY + 3 * Math.pow(1-t, 2) * t * controlPoint1Y + 3 * (1-t) * Math.pow(t, 2) * controlPoint2Y + Math.pow(t, 3) * targetY;

    const midPoint = { x: midX, y: midY };

    // Поиск связанной кнопки
    const relatedButton = sourceNode.data.buttons.find(button => 
      button.action === 'goto' && button.target === connection.target
    );

    const buttonInfo = relatedButton ? {
      text: relatedButton.text,
      action: relatedButton.action,
      hasButton: true
    } : null;

    return { path, midPoint, distance, buttonInfo, hasButton: !!relatedButton };
  }, [connection, nodes]);

  if (!path) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'goto': return <ArrowRight className="h-3 w-3" />;
      case 'command': return <Terminal className="h-3 w-3" />;
      case 'url': return <ExternalLink className="h-3 w-3" />;
      default: return <Mouse className="h-3 w-3" />;
    }
  };

  const getConnectionType = () => {
    if (hasButton) return 'button';
    return 'direct';
  };

  const connectionType = getConnectionType();

  return (
    <g className="connection-line">
      {/* Невидимая толстая линия для кликов */}
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
        stroke={
          isSelected 
            ? "hsl(var(--primary))" 
            : connectionType === 'button' 
              ? "hsl(var(--green-500))" 
              : "hsl(var(--muted-foreground))"
        }
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        strokeDasharray={
          connectionType === 'button' 
            ? "none" 
            : "5,5"
        }
        className={`
          transition-all duration-300
          ${isSelected ? 'drop-shadow-md' : ''}
          ${connectionType === 'button' ? 'opacity-100' : 'opacity-70'}
        `}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Стрелка */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={
              isSelected 
                ? "hsl(var(--primary))" 
                : connectionType === 'button' 
                  ? "hsl(var(--green-500))" 
                  : "hsl(var(--muted-foreground))"
            }
          />
        </marker>
      </defs>

      {/* Информация о кнопке */}
      {showButtonInfo && (
        <foreignObject
          x={midPoint.x - 60}
          y={midPoint.y - 15}
          width="120"
          height="30"
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center h-full">
            {buttonInfo ? (
              <Badge 
                variant="secondary" 
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1"
              >
                {getActionIcon(buttonInfo.action)}
                <span className="truncate max-w-16">{buttonInfo.text}</span>
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>Нет кнопки</span>
              </Badge>
            )}
          </div>
        </foreignObject>
      )}

      {/* Кнопка удаления */}
      {isSelected && onDelete && (
        <foreignObject
          x={midPoint.x + 65}
          y={midPoint.y - 12}
          width="24"
          height="24"
          className="pointer-events-auto"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Удалить соединение"
          >
            ×
          </button>
        </foreignObject>
      )}

      {/* Индикатор типа соединения */}
      <circle
        cx={midPoint.x}
        cy={midPoint.y}
        r="4"
        fill={
          connectionType === 'button' 
            ? "hsl(var(--green-500))" 
            : "hsl(var(--yellow-500))"
        }
        stroke="white"
        strokeWidth="2"
        className={`
          transition-all duration-300
          ${isSelected ? 'r-6' : 'r-4'}
          cursor-pointer
        `}
        onClick={onClick}
      />
    </g>
  );
}