import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Node, Connection } from '@shared/schema';
import { generateAutoConnections } from '@/utils/auto-hierarchy';

interface AutoConnectionButtonProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionsAdd: (connections: Connection[]) => void;
  disabled?: boolean;
}

export function AutoConnectionButton({
  nodes,
  connections,
  onConnectionsAdd,
  disabled = false
}: AutoConnectionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateConnections = async () => {
    if (nodes.length === 0 || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Генерируем автоматические соединения
      const newConnections = generateAutoConnections(nodes, connections);
      
      if (newConnections.length > 0) {
        onConnectionsAdd(newConnections);
      }
    } catch (error) {
      console.error('Ошибка при генерации соединений:', error);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 800);
    }
  };

  const connectionCount = generateAutoConnections(nodes, connections).length;

  return (
    <Button
      onClick={handleGenerateConnections}
      disabled={disabled || nodes.length === 0 || isGenerating || connectionCount === 0}
      className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
      title={`Генерация соединений${connectionCount > 0 ? ` (${connectionCount} новых)` : ''}`}
    >
      {isGenerating ? (
        <i className="fas fa-spinner fa-spin text-gray-600 dark:text-gray-400 text-sm"></i>
      ) : (
        <div className="relative">
          <i className="fas fa-project-diagram text-gray-600 dark:text-gray-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"></i>
          {connectionCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {connectionCount > 9 ? '9+' : connectionCount}
            </span>
          )}
        </div>
      )}
    </Button>
  );
}