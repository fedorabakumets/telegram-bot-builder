import React, { useMemo } from 'react';
import { Node, Connection } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ButtonConnectionsLayerProps {
  nodes: Node[];
  connections: Connection[];
  showButtonConnections?: boolean;
}

interface ButtonConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  buttonId: string;
  buttonText: string;
  buttonPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  path: string;
  midPoint: { x: number; y: number };
}

export function ButtonConnectionsLayer({ 
  nodes, 
  connections, 
  showButtonConnections = true 
}: ButtonConnectionsLayerProps) {
  const buttonConnections = useMemo(() => {
    if (!showButtonConnections) return [];
    
    const buttonConnections: ButtonConnection[] = [];
    
    nodes.forEach(sourceNode => {
      if (!sourceNode.data.buttons || sourceNode.data.buttons.length === 0) return;
      
      // Calculate node dimensions matching CanvasNode layout
      const nodeWidth = 320;
      const headerHeight = 80; // Header with title and description
      const messageHeight = sourceNode.data.messageText ? 80 : 0; // Message preview area
      const imageHeight = sourceNode.type === 'photo' ? 120 : 0; // Image preview area
      
      // Base content height before buttons
      const baseContentHeight = headerHeight + messageHeight + imageHeight;
      
      // Calculate buttons section start
      const buttonsStartY = sourceNode.position.y + baseContentHeight + 16; // 16px for spacing
      
      sourceNode.data.buttons.forEach((button, buttonIndex) => {
        // Only show connections for goto buttons that have valid targets
        if (button.action !== 'goto' || !button.target) return;
        
        const targetNode = nodes.find(n => n.id === button.target);
        if (!targetNode) return;
        
        // Calculate button position based on actual layout
        let buttonX: number;
        let buttonY: number;
        
        if (sourceNode.data.keyboardType === 'inline') {
          // Inline buttons: 2 columns grid layout
          const row = Math.floor(buttonIndex / 2);
          const col = buttonIndex % 2;
          const buttonAreaPadding = 16;
          const sectionHeaderHeight = 24; // "Inline кнопки" header
          const buttonWidth = 140;
          const buttonHeight = 48;
          const gridGap = 8;
          
          buttonX = sourceNode.position.x + buttonAreaPadding + (col * (buttonWidth + gridGap)) + (buttonWidth / 2);
          buttonY = buttonsStartY + sectionHeaderHeight + (row * (buttonHeight + gridGap)) + (buttonHeight / 2);
        } else {
          // Reply buttons: single column layout
          const buttonAreaPadding = 16;
          const sectionHeaderHeight = 24; // "Reply кнопки" header
          const buttonHeight = 48;
          const buttonSpacing = 8;
          
          buttonX = sourceNode.position.x + buttonAreaPadding + 24; // Small right offset from start
          buttonY = buttonsStartY + sectionHeaderHeight + (buttonIndex * (buttonHeight + buttonSpacing)) + (buttonHeight / 2);
        }
        
        // Calculate target position (left edge, middle of node)
        const targetBaseHeight = 200;
        const targetButtonHeight = targetNode.data.buttons.length > 0 ? 
          (targetNode.data.keyboardType === 'inline' ? 
            Math.ceil(targetNode.data.buttons.length / 2) * 50 : 
            targetNode.data.buttons.length * 40) : 0;
        const targetNodeHeight = targetBaseHeight + targetButtonHeight;
        
        const targetX = targetNode.position.x - 8;
        const targetY = targetNode.position.y + targetNodeHeight / 2;
        
        // Create hierarchical straight lines like organizational chart
        const deltaX = targetX - buttonX;
        const deltaY = targetY - buttonY;
        
        // Calculate intermediate point for hierarchical routing
        const horizontalDistance = Math.abs(deltaX);
        const verticalDistance = Math.abs(deltaY);
        
        let path: string;
        let midX: number;
        let midY: number;
        
        if (horizontalDistance > verticalDistance) {
          // Horizontal-first routing (like org chart)
          const intermediateX = buttonX + (deltaX * 0.7);
          const intermediateY = buttonY;
          
          path = `M ${buttonX} ${buttonY} L ${intermediateX} ${intermediateY} L ${intermediateX} ${targetY} L ${targetX} ${targetY}`;
          midX = intermediateX;
          midY = (buttonY + targetY) / 2;
        } else {
          // Vertical-first routing
          const intermediateX = buttonX;
          const intermediateY = buttonY + (deltaY * 0.7);
          
          path = `M ${buttonX} ${buttonY} L ${intermediateX} ${intermediateY} L ${targetX} ${intermediateY} L ${targetX} ${targetY}`;
          midX = (buttonX + targetX) / 2;
          midY = intermediateY;
        }
        
        buttonConnections.push({
          id: `${sourceNode.id}-${button.id}-${targetNode.id}`,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          buttonId: button.id,
          buttonText: button.text,
          buttonPosition: { x: buttonX, y: buttonY },
          targetPosition: { x: targetX, y: targetY },
          path,
          midPoint: { x: midX, y: midY }
        });
      });
    });
    
    return buttonConnections;
  }, [nodes, connections, showButtonConnections]);
  
  if (!showButtonConnections || buttonConnections.length === 0) return null;
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 1, // Below regular connections but above canvas
        overflow: 'visible'
      }}
    >
      {buttonConnections.map((connection) => (
        <g key={connection.id} className="button-connection">
          {/* Arrow marker definition */}
          <defs>
            <marker
              id={`arrow-${connection.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="hsl(var(--muted-foreground))"
                className="opacity-70"
              />
            </marker>
          </defs>
          
          {/* Hierarchical connection line with arrow */}
          <path
            d={connection.path}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#arrow-${connection.id})`}
            className="opacity-70 hover:opacity-100 transition-opacity duration-200"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          />
          
          {/* Source point indicator */}
          <circle
            cx={connection.buttonPosition.x}
            cy={connection.buttonPosition.y}
            r="3"
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth="1"
            className="opacity-80"
          />
          
          {/* Minimal button label */}
          <foreignObject
            x={connection.midPoint.x - 50}
            y={connection.midPoint.y - 10}
            width="100"
            height="20"
            className="pointer-events-none"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 text-center truncate shadow-sm">
              {connection.buttonText}
            </div>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}