import { useRef, useCallback, useState } from 'react';
import { CanvasNode } from '@/components/ui/canvas-node';
import { Node, ComponentDefinition } from '@/types/bot';
import { nanoid } from 'nanoid';

interface CanvasProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeAdd: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
}

export function Canvas({ 
  nodes, 
  selectedNodeId, 
  onNodeSelect, 
  onNodeAdd, 
  onNodeDelete,
  onNodeMove 
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const componentData = e.dataTransfer.getData('application/json');
    if (!componentData) return;
    
    const component: ComponentDefinition = JSON.parse(componentData);
    const rect = canvasRef.current?.getBoundingClientRect();
    
    if (rect) {
      const x = e.clientX - rect.left - 160; // Adjust for node width
      const y = e.clientY - rect.top - 50;   // Adjust for node height
      
      const newNode: Node = {
        id: nanoid(),
        type: component.type,
        position: { x: Math.max(0, x), y: Math.max(0, y) },
        data: {
          keyboardType: 'none',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
          markdown: false,
          ...component.defaultData
        }
      };
      
      onNodeAdd(newNode);
    }
  }, [onNodeAdd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect('');
    }
  }, [onNodeSelect]);

  return (
    <main className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      <div className="absolute inset-0 overflow-auto p-8">
        {/* Enhanced Canvas Controls */}
        <div className="absolute top-6 left-6 flex items-center space-x-3 z-10 canvas-controls">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 flex items-center overflow-hidden">
            <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 group">
              <i className="fas fa-search-minus text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-x border-gray-200 dark:border-slate-700 font-mono min-w-[4rem] text-center bg-gray-50 dark:bg-slate-800/50">100%</span>
            <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 group">
              <i className="fas fa-search-plus text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group">
              <i className="fas fa-expand-arrows-alt text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>

            <button className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group">
              <i className="fas fa-undo text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>

            <button className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group">
              <i className="fas fa-redo text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>
          </div>
        </div>
        
        {/* Enhanced Canvas Grid */}
        <div 
          ref={canvasRef}
          className="min-h-full relative canvas-grid-modern"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0),
              linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 24px 24px, 24px 24px',
            minHeight: '100vh',
            minWidth: '100%'
          }}
          data-drag-over={isDragOver}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleCanvasClick}
        >
          {/* Nodes */}
          {nodes.map((node) => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={() => onNodeSelect(node.id)}
              onDelete={() => onNodeDelete(node.id)}
              onMove={(position) => onNodeMove(node.id, position)}
            />
          ))}
          
          {/* Drop Zone Hint */}
          {nodes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-10 w-96 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 dark:border-blue-800">
                <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-2xl"></i>
              </div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-3 font-semibold text-lg">Перетащите элемент сюда</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Выберите компонент из левой панели и перетащите на холст для создания бота</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
