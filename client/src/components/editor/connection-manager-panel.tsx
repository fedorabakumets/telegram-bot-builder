import React, { useState, useCallback, useMemo } from 'react';
import { Node, Connection, Button } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button as UIButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Zap, 
  Target, 
  Link, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Network,
  Settings,
  Lightbulb,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Search,
  Workflow
} from 'lucide-react';
import { ConnectionManager, ConnectionSuggestion } from '@/utils/connection-manager';
import { HierarchicalDiagram } from '@/components/ui/hierarchical-diagram';
import { cn } from '@/lib/utils';

interface ConnectionManagerPanelProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionsChange: (connections: Connection[]) => void;
  onNodesChange: (nodes: Node[]) => void;
  autoButtonCreation: boolean;
  onAutoButtonCreationChange: (enabled: boolean) => void;
  selectedConnectionId?: string;
  onConnectionSelect?: (connectionId: string | null) => void;
}

export function ConnectionManagerPanel({
  nodes,
  connections,
  onConnectionsChange,
  onNodesChange,
  autoButtonCreation,
  onAutoButtonCreationChange,
  selectedConnectionId,
  onConnectionSelect
}: ConnectionManagerPanelProps) {
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'button' | 'direct'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const connectionManager = useMemo(() => 
    new ConnectionManager({
      nodes,
      connections,
      autoButtonCreation
    }),
    [nodes, connections, autoButtonCreation]
  );

  const connectionStats = useMemo(() => {
    const total = connections.length;
    const withButtons = connections.filter(conn => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      return sourceNode?.data.buttons.some(b => b.action === 'goto' && b.target === conn.target);
    }).length;
    const orphaned = connections.filter(conn => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      const targetNode = nodes.find(n => n.id === conn.target);
      return !sourceNode || !targetNode;
    }).length;

    return { total, withButtons, direct: total - withButtons, orphaned };
  }, [connections, nodes]);

  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      const targetNode = nodes.find(n => n.id === conn.target);
      
      if (!sourceNode || !targetNode) return false;
      
      const hasButton = sourceNode.data.buttons.some(b => 
        b.action === 'goto' && b.target === conn.target
      );
      
      if (filterType === 'button' && !hasButton) return false;
      if (filterType === 'direct' && hasButton) return false;
      
      if (searchTerm) {
        const sourceType = sourceNode.type;
        const targetType = targetNode.type;
        const searchLower = searchTerm.toLowerCase();
        return sourceType.includes(searchLower) || targetType.includes(searchLower);
      }
      
      return true;
    });
  }, [connections, nodes, filterType, searchTerm]);

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    try {
      connectionManager.updateState({ nodes, connections });
      const newSuggestions = connectionManager.generateConnectionSuggestions();
      setSuggestions(newSuggestions);
    } finally {
      setIsGenerating(false);
    }
  }, [connectionManager, nodes, connections]);

  const applySuggestion = useCallback((suggestion: ConnectionSuggestion) => {
    try {
      const { connection, updatedNodes } = connectionManager.createConnection(
        suggestion.connection.source,
        suggestion.connection.target,
        {
          autoCreateButton: autoButtonCreation,
          buttonText: suggestion.suggestedButton.text,
          buttonAction: suggestion.suggestedButton.action
        }
      );

      onConnectionsChange([...connections, connection]);
      onNodesChange(updatedNodes);
      
      // Удаляем примененное предложение
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Ошибка при применении предложения:', error);
    }
  }, [connectionManager, connections, onConnectionsChange, onNodesChange, autoButtonCreation]);

  const deleteConnection = useCallback((connectionId: string) => {
    connectionManager.updateState({ nodes, connections });
    const { removedConnection, updatedNodes } = connectionManager.removeConnection(connectionId);
    
    if (removedConnection) {
      onConnectionsChange(connections.filter(c => c.id !== connectionId));
      onNodesChange(updatedNodes);
      
      if (selectedConnectionId === connectionId) {
        onConnectionSelect?.(null);
      }
    }
  }, [connectionManager, nodes, connections, onConnectionsChange, onNodesChange, selectedConnectionId, onConnectionSelect]);

  const syncButtonsWithConnections = useCallback(() => {
    connectionManager.updateState({ nodes, connections });
    const updatedNodes = connectionManager.syncButtonsWithConnections();
    onNodesChange(updatedNodes);
  }, [connectionManager, nodes, connections, onNodesChange]);

  const cleanupOrphanedButtons = useCallback(() => {
    connectionManager.updateState({ nodes, connections });
    const updatedNodes = connectionManager.cleanupOrphanedButtons();
    onNodesChange(updatedNodes);
  }, [connectionManager, nodes, connections, onNodesChange]);

  const getNodeName = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'Неизвестный узел';
    
    const typeNames = {
      start: 'Старт',
      command: node.data.command || 'Команда',
      message: 'Сообщение',
      keyboard: 'Клавиатура',
      photo: 'Фото',
      condition: 'Условие',
      input: 'Ввод'
    };
    
    return typeNames[node.type] || node.type;
  }, [nodes]);

  const getConnectionTypeIcon = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const hasButton = sourceNode?.data.buttons.some(b => 
      b.action === 'goto' && b.target === connection.target
    );
    
    return hasButton ? <Link className="h-4 w-4 text-green-500" /> : <ArrowRight className="h-4 w-4 text-blue-500" />;
  }, [nodes]);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, []);

  return (
    <div className="w-full h-full bg-background">
      <Tabs defaultValue="connections" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Связи</TabsTrigger>
          <TabsTrigger value="hierarchy">Иерархия</TabsTrigger>
          <TabsTrigger value="suggestions">Предложения</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Управление связями
              </CardTitle>
              <CardDescription>
                Всего связей: {connectionStats.total} | С кнопками: {connectionStats.withButtons} | Прямые: {connectionStats.direct}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Фильтры */}
                <div className="flex flex-wrap gap-2">
                  <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="button">С кнопками</SelectItem>
                      <SelectItem value="direct">Прямые</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm">С кнопками: {connectionStats.withButtons}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">Прямые: {connectionStats.direct}</span>
                  </div>
                </div>

                {/* Список связей */}
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {filteredConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent",
                          selectedConnectionId === connection.id && "bg-accent border-primary"
                        )}
                        onClick={() => onConnectionSelect?.(connection.id)}
                      >
                        <div className="flex items-center gap-3">
                          {getConnectionTypeIcon(connection)}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {getNodeName(connection.source)} → {getNodeName(connection.target)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {connection.id}
                            </span>
                          </div>
                        </div>
                        
                        <UIButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConnection(connection.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </UIButton>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Инструменты */}
                <div className="flex flex-wrap gap-2">
                  <UIButton
                    variant="outline"
                    size="sm"
                    onClick={syncButtonsWithConnections}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Синхронизировать кнопки
                  </UIButton>
                  <UIButton
                    variant="outline"
                    size="sm"
                    onClick={cleanupOrphanedButtons}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Очистить лишние кнопки
                  </UIButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Иерархическая диаграмма
              </CardTitle>
              <CardDescription>
                Визуализация структуры бота в виде иерархической схемы с соединительными линиями
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <div className="space-y-4 h-full">
                {/* Настройки отображения */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="layout-select" className="text-sm">Стиль:</Label>
                    <Select defaultValue="org-chart">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="org-chart">Органиграмма</SelectItem>
                        <SelectItem value="tree">Дерево</SelectItem>
                        <SelectItem value="network">Сеть</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="show-labels" className="text-sm">Подписи:</Label>
                    <Switch id="show-labels" defaultChecked />
                  </div>
                </div>

                {/* Диаграмма */}
                <div className="flex-1 min-h-0 border rounded-lg">
                  <HierarchicalDiagram
                    nodes={nodes}
                    connections={connections}
                    selectedNodeId={selectedConnectionId ? connections.find(c => c.id === selectedConnectionId)?.source : undefined}
                    onNodeClick={(nodeId) => {
                      // Найти связь с этим узлом
                      const connection = connections.find(c => c.source === nodeId || c.target === nodeId);
                      if (connection) {
                        onConnectionSelect?.(connection.id);
                      }
                    }}
                    className="w-full h-full"
                    showLabels={true}
                    layout="org-chart"
                  />
                </div>

                {nodes.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Добавьте узлы для отображения иерархии</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Предложения связей
              </CardTitle>
              <CardDescription>
                Автоматические предложения для улучшения структуры бота
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <UIButton
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Генерация...' : 'Создать предложения'}
                </UIButton>

                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              {getNodeName(suggestion.connection.source)} → {getNodeName(suggestion.connection.target)}
                            </span>
                          </div>
                          <Badge className={cn("text-xs", getConfidenceColor(suggestion.confidence))}>
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {suggestion.reason}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.suggestedButton.text}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.suggestedButton.action}
                            </Badge>
                          </div>
                          
                          <UIButton
                            size="sm"
                            onClick={() => applySuggestion(suggestion)}
                            disabled={suggestion.confidence < 0.5}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Применить
                          </UIButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Настройки связей
              </CardTitle>
              <CardDescription>
                Конфигурация поведения системы связей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-button-creation">Автоматическое создание кнопок</Label>
                    <p className="text-sm text-muted-foreground">
                      Автоматически создавать кнопки при добавлении новых связей
                    </p>
                  </div>
                  <Switch
                    id="auto-button-creation"
                    checked={autoButtonCreation}
                    onCheckedChange={onAutoButtonCreationChange}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show-advanced">Расширенные настройки</Label>
                    <p className="text-sm text-muted-foreground">
                      Показать дополнительные опции управления
                    </p>
                  </div>
                  <Switch
                    id="show-advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium">Расширенные настройки</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="validate-connections">Валидация связей</Label>
                        <Switch id="validate-connections" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-cleanup">Автоочистка</Label>
                        <Switch id="auto-cleanup" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smart-suggestions">Умные предложения</Label>
                        <Switch id="smart-suggestions" defaultChecked />
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Диагностика */}
                <div className="space-y-4">
                  <h4 className="font-medium">Диагностика</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-card border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Активные связи</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {connectionStats.total - connectionStats.orphaned}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-card border rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Поврежденные</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {connectionStats.orphaned}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}