import React, { useMemo } from 'react';
import { Node, Connection } from '@shared/schema';
import { cn } from '@/lib/utils';

interface HierarchicalNode {
  id: string;
  title: string;
  subtitle?: string;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  children: string[];
  parent?: string;
  type?: string;
}

interface HierarchicalConnection {
  id: string;
  source: string;
  target: string;
  path: string;
}

interface HierarchicalDiagramProps {
  nodes: Node[];
  connections: Connection[];
  className?: string;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
  showLabels?: boolean;
  layout?: 'tree' | 'org-chart' | 'network';
  spacing?: {
    horizontal: number;
    vertical: number;
  };
}

export function HierarchicalDiagram({
  nodes,
  connections,
  className,
  onNodeClick,
  selectedNodeId,
  showLabels = true,
  layout = 'org-chart',
  spacing = { horizontal: 200, vertical: 120 }
}: HierarchicalDiagramProps) {
  
  const { hierarchicalNodes, hierarchicalConnections, bounds } = useMemo(() => {
    if (!nodes.length) return { hierarchicalNodes: [], hierarchicalConnections: [], bounds: { width: 0, height: 0 } };

    // Создаем карту узлов по ID
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // Создаем карту связей для быстрого поиска детей
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    connections.forEach(connection => {
      const children = childrenMap.get(connection.source) || [];
      children.push(connection.target);
      childrenMap.set(connection.source, children);
      parentMap.set(connection.target, connection.source);
    });

    // Находим корневые узлы (узлы без родителей)
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));
    
    // Если нет корневых узлов, используем первый узел
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(nodes[0]);
    }

    // Рассчитываем уровни для каждого узла
    const levelMap = new Map<string, number>();
    const visited = new Set<string>();
    
    function calculateLevels(nodeId: string, level: number = 0) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      levelMap.set(nodeId, level);
      const children = childrenMap.get(nodeId) || [];
      children.forEach(childId => calculateLevels(childId, level + 1));
    }

    rootNodes.forEach(rootNode => calculateLevels(rootNode.id));

    // Группируем узлы по уровням
    const levelGroups = new Map<number, string[]>();
    levelMap.forEach((level, nodeId) => {
      const group = levelGroups.get(level) || [];
      group.push(nodeId);
      levelGroups.set(level, group);
    });

    // Рассчитываем позиции узлов
    const hierarchicalNodes: HierarchicalNode[] = [];
    const maxLevel = Math.max(...Array.from(levelMap.values()));
    
    levelGroups.forEach((nodeIds, level) => {
      const levelWidth = nodeIds.length * spacing.horizontal;
      const startX = -levelWidth / 2;
      
      nodeIds.forEach((nodeId, index) => {
        const originalNode = nodeMap.get(nodeId);
        if (!originalNode) return;
        
        const x = startX + index * spacing.horizontal;
        const y = level * spacing.vertical;
        
        hierarchicalNodes.push({
          id: nodeId,
          title: originalNode.data.title || 'Без названия',
          subtitle: originalNode.data.description || originalNode.type,
          level,
          x,
          y,
          width: 160,
          height: 60,
          children: childrenMap.get(nodeId) || [],
          parent: parentMap.get(nodeId),
          type: originalNode.type
        });
      });
    });

    // Создаем соединительные линии
    const hierarchicalConnections: HierarchicalConnection[] = [];
    
    connections.forEach(connection => {
      const sourceNode = hierarchicalNodes.find(n => n.id === connection.source);
      const targetNode = hierarchicalNodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return;
      
      const sourceX = sourceNode.x + sourceNode.width / 2;
      const sourceY = sourceNode.y + sourceNode.height;
      const targetX = targetNode.x + targetNode.width / 2;
      const targetY = targetNode.y;
      
      // Создаем path для соединительной линии
      let path: string;
      
      if (layout === 'org-chart') {
        // Органический стиль с изгибами
        const midY = sourceY + (targetY - sourceY) / 2;
        path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
      } else if (layout === 'tree') {
        // Прямые линии
        path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      } else {
        // Сетевой стиль с кривыми
        const controlY = sourceY + (targetY - sourceY) / 2;
        path = `M ${sourceX} ${sourceY} Q ${sourceX} ${controlY} ${targetX} ${targetY}`;
      }
      
      hierarchicalConnections.push({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        path
      });
    });

    // Рассчитываем границы диаграммы
    const bounds = {
      width: Math.max(...hierarchicalNodes.map(n => n.x + n.width)) - Math.min(...hierarchicalNodes.map(n => n.x)) + 100,
      height: Math.max(...hierarchicalNodes.map(n => n.y + n.height)) + 50
    };

    return { hierarchicalNodes, hierarchicalConnections, bounds };
  }, [nodes, connections, spacing, layout]);

  if (!hierarchicalNodes.length) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground", className)}>
        <div className="text-center">
          <i className="fas fa-sitemap text-4xl mb-4 opacity-50"></i>
          <p>Нет данных для отображения диаграммы</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full relative hierarchy-diagram rounded-lg overflow-auto", className)}>
      <svg 
        width={bounds.width} 
        height={bounds.height}
        className="w-full h-full"
        viewBox={`${Math.min(...hierarchicalNodes.map(n => n.x)) - 50} 0 ${bounds.width} ${bounds.height}`}
      >
        {/* Определения для стрелок */}
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
              fill="hsl(var(--border))"
              className="transition-colors"
            />
          </marker>
        </defs>

        {/* Соединительные линии */}
        {hierarchicalConnections.map(connection => (
          <path
            key={connection.id}
            d={connection.path}
            className="hierarchy-connection"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Узлы */}
        {hierarchicalNodes.map(node => (
          <g key={node.id}>
            {/* Фон узла */}
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="8"
              fill={selectedNodeId === node.id ? "hsl(var(--primary))" : "hsl(var(--background))"}
              stroke={selectedNodeId === node.id ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth="2"
              className={cn(
                "cursor-pointer transition-all duration-200",
                selectedNodeId === node.id 
                  ? "drop-shadow-lg" 
                  : "hover:drop-shadow-md"
              )}
              onClick={() => onNodeClick?.(node.id)}
            />
            
            {/* Заголовок */}
            <text
              x={node.x + node.width / 2}
              y={node.y + 22}
              textAnchor="middle"
              className={cn("hierarchy-label", selectedNodeId === node.id && "fill-white")}
              fill={selectedNodeId === node.id ? "white" : "hsl(var(--foreground))"}
            >
              {node.title.length > 18 ? node.title.substring(0, 18) + '...' : node.title}
            </text>
            
            {/* Подзаголовок */}
            {showLabels && node.subtitle && (
              <text
                x={node.x + node.width / 2}
                y={node.y + 40}
                textAnchor="middle"
                className={cn("hierarchy-subtitle", selectedNodeId === node.id && "fill-white opacity-80")}
                fill={selectedNodeId === node.id ? "white" : "hsl(var(--muted-foreground))"}
              >
                {node.subtitle.length > 22 ? node.subtitle.substring(0, 22) + '...' : node.subtitle}
              </text>
            )}
            
            {/* Индикатор типа узла */}
            <circle
              cx={node.x + 12}
              cy={node.y + 12}
              r="6"
              fill={selectedNodeId === node.id ? "white" : "hsl(var(--primary))"}
              className="opacity-80"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}