import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle, 
  Link2, 
  Settings, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { Node, Connection } from '@/types/bot';
import { ConnectionManager, ConnectionSuggestion } from '@/utils/connection-manager';

interface AutoConnectionPanelProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionAdd: (connection: Connection) => void;
  onNodesUpdate: (nodes: Node[]) => void;
  autoButtonCreation: boolean;
  onAutoButtonCreationChange: (enabled: boolean) => void;
}

export function AutoConnectionPanel({
  nodes,
  connections,
  onConnectionAdd,
  onNodesUpdate,
  autoButtonCreation,
  onAutoButtonCreationChange
}: AutoConnectionPanelProps) {
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const connectionManager = new ConnectionManager({
    nodes,
    connections,
    autoButtonCreation
  });

  useEffect(() => {
    generateSuggestions();
  }, [nodes, connections]);

  const generateSuggestions = () => {
    setIsGenerating(true);
    try {
      const newSuggestions = connectionManager.generateConnectionSuggestions();
      setSuggestions(newSuggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestion: ConnectionSuggestion) => {
    try {
      const { connection, updatedNodes } = connectionManager.createConnection(
        suggestion.connection.source,
        suggestion.connection.target,
        {
          autoCreateButton: autoButtonCreation,
          buttonText: suggestion.suggestedButton.text,
          buttonAction: (suggestion.suggestedButton.action && ['goto', 'command', 'url', 'contact', 'location', 'selection', 'default'].includes(suggestion.suggestedButton.action)) 
            ? suggestion.suggestedButton.action as 'goto' | 'command' | 'url' | 'contact' | 'location' | 'selection' | 'default'
            : 'goto'
        }
      );

      onConnectionAdd(connection);
      onNodesUpdate(updatedNodes);
      setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    } catch (error) {
      console.error('Ошибка при применении предложения:', error);
    }
  };

  const applyAllHighConfidence = () => {
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
    
    highConfidenceSuggestions.forEach(suggestion => {
      if (!appliedSuggestions.has(suggestion.id)) {
        applySuggestion(suggestion);
      }
    });
  };

  const syncButtonsWithConnections = () => {
    const updatedNodes = connectionManager.syncButtonsWithConnections();
    onNodesUpdate(updatedNodes);
  };

  const cleanupOrphanedButtons = () => {
    const updatedNodes = connectionManager.cleanupOrphanedButtons();
    onNodesUpdate(updatedNodes);
  };

  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'Неизвестный узел';
    
    switch (node.type) {
      case 'start': return 'Старт';
      case 'command': return node.data.command || 'Команда';
      case 'message': return node.data.messageText?.slice(0, 20) + '...' || 'Сообщение';
      case 'keyboard': return 'Клавиатура';
      case 'photo': return 'Фото';
      case 'condition': return 'Условие';
      case 'input': return 'Ввод';
      default: return node.type;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Высокая';
    if (confidence >= 0.6) return 'Средняя';
    return 'Низкая';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Автосоединения
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Settings className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Автоматическое создание связей между узлами
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Настройки */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Автосоздание кнопок</label>
            <p className="text-xs text-muted-foreground">
              Создавать кнопки при добавлении связей
            </p>
          </div>
          <Switch
            checked={autoButtonCreation}
            onCheckedChange={onAutoButtonCreationChange}
          />
        </div>

        <Separator />

        {/* Быстрые действия */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Быстрые действия</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={applyAllHighConfidence}
              disabled={suggestions.filter(s => s.confidence > 0.8).length === 0}
            >
              <Zap className="h-4 w-4 mr-1" />
              Применить лучшие
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={syncButtonsWithConnections}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Синхронизировать
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cleanupOrphanedButtons}
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Очистить лишние кнопки
          </Button>
        </div>

        <Separator />

        {/* Предложения */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Предложения</h4>
            <Badge variant="secondary">{suggestions.length}</Badge>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет предложений для соединения</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion.id}
                    className={`p-3 ${appliedSuggestions.has(suggestion.id) ? 'opacity-50' : ''}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getConfidenceColor(suggestion.confidence)} text-white`}
                          >
                            {getConfidenceText(suggestion.confidence)}
                          </Badge>
                          {suggestion.autoCreate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Sparkles className="h-4 w-4 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Рекомендуется к автоприменению</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          disabled={appliedSuggestions.has(suggestion.id)}
                        >
                          {appliedSuggestions.has(suggestion.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            'Применить'
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">
                          {getNodeName(suggestion.connection.source)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">
                          {getNodeName(suggestion.connection.target)}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {suggestion.reason}
                      </div>

                      {autoButtonCreation && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <div className="font-medium">Создаваемая кнопка:</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="bg-background px-2 py-1 rounded">
                              {suggestion.suggestedButton.text}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.suggestedButton.action}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}