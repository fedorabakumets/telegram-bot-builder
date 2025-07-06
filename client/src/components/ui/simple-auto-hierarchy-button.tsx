import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Node, Connection } from '@shared/schema';
import { calculateAutoHierarchy, calculateAutoHierarchyWithConnections } from '@/utils/auto-hierarchy';

interface SimpleAutoHierarchyButtonProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout: (nodes: Node[]) => void;
  onApplyLayoutWithConnections?: (nodes: Node[], connections: Connection[]) => void;
  zoom?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  viewportCenterX?: number;
  viewportCenterY?: number;
}

export function SimpleAutoHierarchyButton({
  nodes,
  connections,
  onApplyLayout,
  onApplyLayoutWithConnections,
  zoom = 100,
  viewportWidth = 1200,
  viewportHeight = 800,
  viewportCenterX = 600,
  viewportCenterY = 400
}: SimpleAutoHierarchyButtonProps) {
  const [isGeneratingConnections, setIsGeneratingConnections] = useState(false);

  const handleAutoHierarchy = () => {
    if (nodes.length === 0) return;
    
    if (onApplyLayoutWithConnections) {
      setIsGeneratingConnections(true);
      
      const result = calculateAutoHierarchyWithConnections(nodes, connections, {
        zoom,
        viewportWidth,
        viewportHeight,
        viewportCenterX,
        viewportCenterY
      });
      
      onApplyLayoutWithConnections(result.nodes, result.connections);
      
      setTimeout(() => {
        setIsGeneratingConnections(false);
      }, 1000);
    } else {
      const layoutNodes = calculateAutoHierarchy(nodes, connections, {
        zoom,
        viewportWidth,
        viewportHeight,
        viewportCenterX,
        viewportCenterY
      });
      
      onApplyLayout(layoutNodes);
    }
  };

  return (
    <Button
      onClick={handleAutoHierarchy}
      disabled={nodes.length === 0 || isGeneratingConnections}
      className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
      title={onApplyLayoutWithConnections ? "Автоматическая иерархия + соединения" : "Автоматическая иерархия"}
    >
      {isGeneratingConnections ? (
        <i className="fas fa-spinner fa-spin text-gray-600 dark:text-gray-400 text-sm"></i>
      ) : (
        <i className="fas fa-sitemap text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
      )}
    </Button>
  );
}