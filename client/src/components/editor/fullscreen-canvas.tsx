import { useEffect, useCallback, useState } from 'react';
import { Canvas } from '@/components/editor/canvas';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Button } from '@/components/ui/button';
import { Node, Connection, ComponentDefinition } from '@/types/bot';

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
  
  const [showComponentsSidebar, setShowComponentsSidebar] = useState(false);

  const handleComponentDrag = useCallback((component: ComponentDefinition) => {
    // Handle component drag if needed
  }, []);

  const toggleComponentsSidebar = useCallback(() => {
    setShowComponentsSidebar(prev => !prev);
  }, []);
  
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
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
        <Button
          onClick={toggleComponentsSidebar}
          variant="outline"
          size="sm"
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <i className="fas fa-th-large mr-2"></i>
          Компоненты
        </Button>
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

      {/* Components Sidebar */}
      {showComponentsSidebar && (
        <div className="absolute left-0 top-0 h-full w-80 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-gray-200/50 dark:border-slate-700/50 shadow-2xl">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Компоненты</h3>
                <Button
                  onClick={toggleComponentsSidebar}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <i className="fas fa-times text-gray-500"></i>
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ComponentsSidebar
                onComponentDrag={handleComponentDrag}
              />
            </div>
          </div>
        </div>
      )}

      {/* Canvas taking full screen */}
      <div className={`transition-all duration-300 ${showComponentsSidebar ? 'ml-80' : 'ml-0'}`}>
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
    </div>
  );
}