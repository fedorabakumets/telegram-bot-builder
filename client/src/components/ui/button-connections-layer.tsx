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
      
      // Calculate node dimensions for button positioning
      const baseHeight = 200;
      const buttonHeight = sourceNode.data.keyboardType === 'inline' ? 
        Math.ceil(sourceNode.data.buttons.length / 2) * 50 : 
        sourceNode.data.buttons.length * 40;
      
      const nodeHeight = baseHeight + buttonHeight;
      const nodeWidth = 320;
      
      // Calculate button start position (beginning of buttons section)
      const buttonsStartY = sourceNode.position.y + baseHeight;
      
      sourceNode.data.buttons.forEach((button, buttonIndex) => {
        // Only show connections for goto buttons that have valid targets
        if (button.action !== 'goto' || !button.target) return;
        
        const targetNode = nodes.find(n => n.id === button.target);
        if (!targetNode) return;
        
        // Calculate button position based on actual layout
        let buttonX: number;
        let buttonY: number;
        
        if (sourceNode.data.keyboardType === 'inline') {
          // Inline buttons: 2 columns grid with proper spacing
          const row = Math.floor(buttonIndex / 2);
          const col = buttonIndex % 2;
          const buttonAreaStartX = sourceNode.position.x + 16; // Account for padding
          const buttonAreaStartY = buttonsStartY + 16; // Account for section header
          const buttonWidth = 140;
          const buttonSpacing = 8;
          
          buttonX = buttonAreaStartX + (col * (buttonWidth + buttonSpacing)) + (buttonWidth / 2);
          buttonY = buttonAreaStartY + (row * 50) + 24; // Center of button height
        } else {
          // Reply buttons: single column with proper spacing
          const buttonAreaStartX = sourceNode.position.x + 16; // Account for padding
          const buttonAreaStartY = buttonsStartY + 16; // Account for section header
          const buttonHeight = 40;
          const buttonSpacing = 8;
          
          buttonX = buttonAreaStartX + 20; // Small offset from left edge
          buttonY = buttonAreaStartY + (buttonIndex * (buttonHeight + buttonSpacing)) + (buttonHeight / 2);
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
        
        // Calculate path for smooth curve
        const deltaX = targetX - buttonX;
        const deltaY = targetY - buttonY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Adaptive curve based on distance
        const controlPointOffset = Math.min(Math.abs(deltaX) / 2, Math.max(60, distance * 0.25));
        
        const controlPoint1X = buttonX + controlPointOffset;
        const controlPoint1Y = buttonY;
        const controlPoint2X = targetX - controlPointOffset;
        const controlPoint2Y = targetY;
        
        const path = `M ${buttonX} ${buttonY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
        
        // Calculate midpoint for labels
        const t = 0.5;
        const midX = Math.pow(1-t, 3) * buttonX + 3 * Math.pow(1-t, 2) * t * controlPoint1X + 3 * (1-t) * Math.pow(t, 2) * controlPoint2X + Math.pow(t, 3) * targetX;
        const midY = Math.pow(1-t, 3) * buttonY + 3 * Math.pow(1-t, 2) * t * controlPoint1Y + 3 * (1-t) * Math.pow(t, 2) * controlPoint2Y + Math.pow(t, 3) * targetY;
        
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
          {/* Connection line */}
          <path
            d={connection.path}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            className="opacity-60 hover:opacity-80 transition-opacity duration-200"
            strokeDasharray="5,3"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
          
          {/* Arrow marker at target */}
          <circle
            cx={connection.targetPosition.x}
            cy={connection.targetPosition.y}
            r="3"
            fill="hsl(var(--primary))"
            className="opacity-80"
          />
          
          {/* Button indicator at source */}
          <circle
            cx={connection.buttonPosition.x}
            cy={connection.buttonPosition.y}
            r="4"
            fill="hsl(var(--primary))"
            className="opacity-70"
          />
          
          {/* Button text label */}
          <foreignObject
            x={connection.midPoint.x - 40}
            y={connection.midPoint.y - 12}
            width="80"
            height="24"
            className="pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm text-center truncate">
              {connection.buttonText}
            </div>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}