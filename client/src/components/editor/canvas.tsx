import { useRef, useCallback } from 'react';
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
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
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect('');
    }
  }, [onNodeSelect]);

  return (
    <main className="w-full h-full bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 overflow-auto p-8">
        {/* Canvas Controls */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
          <div className="bg-background rounded-lg shadow-sm border border-border flex items-center">
            <button className="p-2 hover:bg-muted rounded-l-lg">
              <i className="fas fa-search-minus text-muted-foreground text-sm"></i>
            </button>
            <span className="px-3 py-2 text-sm text-foreground border-x border-border">100%</span>
            <button className="p-2 hover:bg-muted rounded-r-lg">
              <i className="fas fa-search-plus text-muted-foreground text-sm"></i>
            </button>
          </div>
          
          <button className="p-2 bg-background rounded-lg shadow-sm border border-border hover:bg-muted">
            <i className="fas fa-expand-arrows-alt text-muted-foreground text-sm"></i>
          </button>
        </div>
        
        {/* Canvas Grid */}
        <div 
          ref={canvasRef}
          className="min-h-full relative"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            minHeight: '100vh',
            minWidth: '100%'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-8 w-80 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-plus text-gray-400 text-xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Перетащите элемент сюда</h3>
              <p className="text-sm text-gray-500">Выберите компонент из левой панели и перетащите на холст</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
