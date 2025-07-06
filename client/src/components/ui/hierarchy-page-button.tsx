import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Node, Connection } from '@shared/schema';
import { EmbeddedHierarchyPanel } from './embedded-hierarchy-panel';
import { useBotEditor } from '@/hooks/use-bot-editor';

interface HierarchyPageButtonProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout?: (nodes: Node[]) => void;
  onApplyLayoutWithConnections?: (nodes: Node[], connections: Connection[]) => void;
  disabled?: boolean;
}

export function HierarchyPageButton({ 
  nodes, 
  connections, 
  onApplyLayout, 
  onApplyLayoutWithConnections,
  disabled = false 
}: HierarchyPageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { updateNodes } = useBotEditor();

  const handleApplyLayout = (updatedNodes: Node[]) => {
    if (onApplyLayout) {
      onApplyLayout(updatedNodes);
    } else {
      updateNodes(updatedNodes);
    }
    setIsOpen(false);
  };

  const handleApplyLayoutWithConnections = (updatedNodes: Node[], updatedConnections: Connection[]) => {
    if (onApplyLayoutWithConnections) {
      onApplyLayoutWithConnections(updatedNodes, updatedConnections);
    } else {
      updateNodes(updatedNodes);
      // Новые соединения обрабатываются через onApplyLayoutWithConnections
    }
    setIsOpen(false);
  };

  // Рассчитываем статистику для показа на кнопке
  const stats = {
    nodeCount: nodes.length,
    connectionCount: connections.length,
    complexity: Math.min(Math.round((nodes.length + connections.length * 2) / 5), 10)
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || nodes.length === 0}
          className="relative p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Открыть полную систему автоиерархии"
        >
          <div className="flex items-center space-x-2">
            <i className="fas fa-project-diagram text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            <span className="text-xs font-medium">Иерархия</span>
            {stats.nodeCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {stats.nodeCount}
              </Badge>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <i className="fas fa-project-diagram text-blue-500"></i>
            <span>Система автоиерархии</span>
            <div className="flex items-center space-x-2 ml-auto">
              <Badge variant="outline" className="text-xs">
                {stats.nodeCount} узлов
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stats.connectionCount} связей
              </Badge>
              <Badge 
                variant={stats.complexity <= 3 ? "default" : stats.complexity <= 7 ? "secondary" : "destructive"}
                className="text-xs"
              >
                Сложность: {stats.complexity}/10
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Выберите алгоритм компоновки для оптимальной организации узлов на холсте
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <EmbeddedHierarchyPanel 
            nodes={nodes}
            connections={connections}
            onApplyLayout={handleApplyLayout}
            onApplyLayoutWithConnections={handleApplyLayoutWithConnections}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}