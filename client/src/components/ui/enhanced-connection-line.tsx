
import { useMemo } from 'react';
import { Connection, Node } from '@/types/bot';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Mouse, 
  Terminal, 
  ExternalLink, 
  AlertCircle,
  Zap
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
    
    const sourceButtonHeight = sourceNode.data.buttons && sourceNode.data.buttons.length > 0 ? 
      (sourceNode.data.keyboardType === 'inline' ? 
        Math.ceil(sourceNode.data.buttons.length / 2) * 50 : 
        sourceNode.data.buttons.length * 40) : 0;
    
    const targetButtonHeight = targetNode.data.buttons && targetNode.data.buttons.length > 0 ? 
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

    // Прямая линия
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    
    // Средняя точка прямой линии
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const midPoint = { x: midX, y: midY };

    // Поиск связанной кнопки
    const relatedButton = sourceNode.data.buttons ? sourceNode.data.buttons.find(button => 
      button.action === 'goto' && button.target === connection.target
    ) : undefined;

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
    const sourceNode = nodes.find(n => n.id === connection.source);
    if (sourceNode?.data.autoTransitionTo === connection.target) {
      return 'auto-transition';
    }
    if (hasButton) return 'button';
    return 'direct';
  };

  const connectionType = getConnectionType();

  // Цвета для разных типов связей
  const getConnectionColors = () => {
    if (isSelected) {
      return {
        stroke: '#3b82f6',
        gradient1: '#60a5fa',
        gradient2: '#3b82f6',
        shadow: 'rgba(59, 130, 246, 0.3)'
      };
    }
    
    switch (connectionType) {
      case 'auto-transition':
        return {
          stroke: '#10b981',
          gradient1: '#34d399',
          gradient2: '#10b981',
          shadow: 'rgba(16, 185, 129, 0.2)'
        };
      case 'button':
        return {
          stroke: '#8b5cf6',
          gradient1: '#a78bfa',
          gradient2: '#8b5cf6',
          shadow: 'rgba(139, 92, 246, 0.2)'
        };
      default:
        return {
          stroke: '#f59e0b',
          gradient1: '#fbbf24',
          gradient2: '#f59e0b',
          shadow: 'rgba(245, 158, 11, 0.2)'
        };
    }
  };

  const colors = getConnectionColors();

  return (
    <g className="connection-line">
      {/* Определения градиентов и фильтров */}
      <defs>
        {/* Градиент для линии */}
        <linearGradient id={`gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.gradient1} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.gradient2} stopOpacity="1" />
        </linearGradient>

        {/* Свечение */}
        <filter id={`glow-${connection.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Современная стрелка */}
        <marker
          id={`arrow-${connection.id}`}
          markerWidth="12"
          markerHeight="12"
          refX="11"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 0 L 12 6 L 0 12 L 3 6 Z"
            fill={colors.stroke}
            className="transition-all duration-300"
          />
        </marker>
      </defs>

      {/* Невидимая толстая линия для кликов */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="24"
        fill="none"
        className="cursor-pointer"
        onClick={onClick}
      />
      
      {/* Тень линии */}
      {isSelected && (
        <path
          d={path}
          stroke={colors.shadow}
          strokeWidth="8"
          fill="none"
          className="opacity-40 blur-sm"
        />
      )}

      {/* Основная линия с градиентом */}
      <path
        d={path}
        stroke={`url(#gradient-${connection.id})`}
        strokeWidth={isSelected ? "3" : "2.5"}
        fill="none"
        strokeDasharray={connectionType === 'auto-transition' ? "8,4" : "none"}
        className="transition-all duration-300"
        markerEnd={`url(#arrow-${connection.id})`}
        filter={isSelected ? `url(#glow-${connection.id})` : undefined}
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
      />

      {/* Анимированная пунктирная линия для автоперехода */}
      {connectionType === 'auto-transition' && (
        <path
          d={path}
          stroke={colors.gradient1}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4,8"
          className="opacity-60"
          style={{
            animation: 'dash 20s linear infinite',
            strokeLinecap: 'round'
          }}
        />
      )}

      {/* Информация о кнопке или автопереходе */}
      {showButtonInfo && (
        <foreignObject
          x={midPoint.x - 75}
          y={midPoint.y - 18}
          width="150"
          height="36"
          className="pointer-events-none overflow-visible"
        >
          <div className="flex items-center justify-center h-full">
            {connectionType === 'auto-transition' ? (
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg flex items-center gap-1.5 text-xs font-medium">
                <Zap className="h-3.5 w-3.5" />
                <span>Автопереход</span>
              </div>
            ) : buttonInfo ? (
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg flex items-center gap-1.5 text-xs font-medium max-w-full">
                {getActionIcon(buttonInfo.action)}
                <span className="truncate">{buttonInfo.text}</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-md bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-slate-300 shadow-sm flex items-center gap-1.5 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                <span className="opacity-80">Прямая связь</span>
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Кнопка удаления */}
      {isSelected && onDelete && (
        <foreignObject
          x={midPoint.x + 80}
          y={midPoint.y - 14}
          width="28"
          height="28"
          className="pointer-events-auto overflow-visible"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
            title="Удалить соединение"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </foreignObject>
      )}

      {/* CSS для анимации */}
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
        `}
      </style>
    </g>
  );
}
