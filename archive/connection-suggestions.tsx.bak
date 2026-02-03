import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Node, Connection } from '@/types/bot';
import { ConnectionSuggestion, generateAutoConnections } from '@/utils/auto-connection';

interface ConnectionSuggestionsProps {
  nodes: Node[];
  connections: Connection[];
  onCreateConnection: (source: string, target: string) => void;
}

export function ConnectionSuggestions({ nodes, connections, onCreateConnection }: ConnectionSuggestionsProps) {
  const [suggestions] = useState<ConnectionSuggestion[]>(() => 
    generateAutoConnections(nodes, connections).slice(0, 5)
  );

  if (suggestions.length === 0) {
    return null;
  }

  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'Неизвестный узел';
    
    if (node.type === 'start') return 'Старт';
    if (node.type === 'command') return node.data.command || 'Команда';
    if (node.type === 'message') return 'Сообщение';
    if (node.type === 'keyboard') return 'Клавиатура';
    if (node.type === 'photo') return 'Фото';
    if (node.type === 'condition') return 'Условие';
    if (node.type === 'input') return 'Ввод';
    return node.type;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-500';
    if (confidence > 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <i className="fas fa-magic text-blue-500 mr-2" />
          Рекомендации соединений
        </CardTitle>
        <CardDescription className="text-xs">
          Автоматические предложения для улучшения потока бота
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium truncate">
                  {getNodeName(suggestion.source)}
                </span>
                <i className="fas fa-arrow-right text-gray-400 text-xs" />
                <span className="font-medium truncate">
                  {getNodeName(suggestion.target)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {suggestion.reason}
              </p>
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`} />
                  <span className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreateConnection(suggestion.source, suggestion.target)}
              className="ml-2 flex-shrink-0"
            >
              <i className="fas fa-plus text-xs" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}