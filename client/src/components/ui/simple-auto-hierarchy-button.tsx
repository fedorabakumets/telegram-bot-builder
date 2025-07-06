import React from 'react';
import { Button } from '@/components/ui/button';
import { Node, Connection } from '@shared/schema';
import { calculateAutoHierarchy } from '@/utils/auto-hierarchy';

interface SimpleAutoHierarchyButtonProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout: (nodes: Node[]) => void;
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
  zoom = 100,
  viewportWidth = 1200,
  viewportHeight = 800,
  viewportCenterX = 600,
  viewportCenterY = 400
}: SimpleAutoHierarchyButtonProps) {
  const handleAutoHierarchy = () => {
    if (nodes.length === 0) return;
    
    const layoutNodes = calculateAutoHierarchy(nodes, connections, {
      zoom,
      viewportWidth,
      viewportHeight,
      viewportCenterX,
      viewportCenterY
    });
    
    onApplyLayout(layoutNodes);
  };

  return (
    <Button
      onClick={handleAutoHierarchy}
      disabled={nodes.length === 0}
      className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
      title="Автоматическая иерархия"
    >
      <i className="fas fa-sitemap text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
    </Button>
  );
}