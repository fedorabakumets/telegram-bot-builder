import { useEffect, useCallback } from 'react';
import { Canvas } from '@/components/editor/canvas';
import { Button } from '@/components/ui/button';
import { Node, Connection } from '@/types/bot';

interface FullscreenCanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  selectedConnectionId?: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeAdd: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionSelect?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onConnectionAdd?: (connection: Connection) => void;
  onNodesUpdate?: (nodes: Node[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  onExitFullscreen: () => void;
}

export function FullscreenCanvas({
  nodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  onNodeSelect,
  onNodeAdd,
  onNodeDelete,
  onNodeMove,
  onConnectionSelect,
  onConnectionDelete,
  onConnectionAdd,
  onNodesUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  isSaving,
  onExitFullscreen
}: FullscreenCanvasProps) {
  
  // Handle ESC key to exit fullscreen
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onExitFullscreen();
    }
  }, [onExitFullscreen]);

  // Handle F11 key
  const handleF11 = useCallback((event: KeyboardEvent) => {
    if (event.key === 'F11') {
      event.preventDefault();
      onExitFullscreen();
    }
  }, [onExitFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleF11);
    
    // Hide scrollbars on body when in fullscreen
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleF11);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown, handleF11]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950">
      {/* Exit button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={onExitFullscreen}
          variant="outline"
          size="sm"
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <i className="fas fa-times mr-2"></i>
          Выйти из полноэкранного режима
        </Button>
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-4 z-50">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-slate-700/50 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <i className="fas fa-keyboard text-blue-500"></i>
            <span>ESC или F11 для выхода</span>
          </div>
        </div>
      </div>

      {/* Canvas taking full screen */}
      <Canvas
        nodes={nodes}
        connections={connections}
        selectedNodeId={selectedNodeId}
        selectedConnectionId={selectedConnectionId}
        onNodeSelect={onNodeSelect}
        onNodeAdd={onNodeAdd}
        onNodeDelete={onNodeDelete}
        onNodeMove={onNodeMove}
        onConnectionSelect={onConnectionSelect}
        onConnectionDelete={onConnectionDelete}
        onConnectionAdd={onConnectionAdd}
        onNodesUpdate={onNodesUpdate}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={onSave}
        isSaving={isSaving}
      />
    </div>
  );
}