import React, { useState, useCallback, useMemo } from 'react';
import { Node, Connection, Button } from '@/types/bot';
import { Badge } from '@/components/ui/badge';
import { Button as UIButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowRight, 
  Link, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Zap,
  Eye,
  Edit3,
  Trash2,
  MousePointer,
  Network,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionVisualizationProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionSelect?: (connection: Connection) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onConnectionEdit?: (connection: Connection) => void;
  selectedConnectionId?: string;
  showLabels?: boolean;
  showMetrics?: boolean;
  interactive?: boolean;
}

interface ConnectionMetrics {
  id: string;
  strength: number;
  usage: number;
  importance: number;
  hasButton: boolean;
  buttonType?: 'goto' | 'command' | 'url';
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export function ConnectionVisualization({
  nodes,
  connections,
  onConnectionSelect,
  onConnectionDelete,
  onConnectionEdit,
  selectedConnectionId,
  showLabels = true,
  showMetrics = true,
  interactive = true
}: ConnectionVisualizationProps) {
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'strong' | 'weak' | 'problematic'>('all');

  // Расчет метрик для каждой связи
  const connectionMetrics = useMemo(() => {
    return connections.map(connection => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) {
        return {
          id: connection.id,
          strength: 0,
          usage: 0,
          importance: 0,
          hasButton: false,
          isValid: false,
          errors: ['Отсутствует исходный или целевой узел'],
          suggestions: ['Удалить неработающую связь']
        } as ConnectionMetrics;
      }

      // Проверка наличия кнопки
      const relatedButton = sourceNode.data.buttons.find(b => 
        b.action === 'goto' && b.target === connection.target
      );

      // Расчет силы связи
      let strength = 0.5;
      if (relatedButton) strength += 0.3;
      if (sourceNode.type === 'start') strength += 0.2;
      if (targetNode.type === 'message') strength += 0.1;

      // Расчет важности
      let importance = 0.5;
      if (sourceNode.type === 'start') importance += 0.3;
      if (relatedButton) importance += 0.2;
      const connectionsFromSource = connections.filter(c => c.source === connection.source).length;
      importance += Math.min(0.2, connectionsFromSource * 0.05);

      // Проверка валидности
      const errors: string[] = [];
      const suggestions: string[] = [];

      if (!relatedButton && ['message', 'photo', 'keyboard'].includes(sourceNode.type)) {
        errors.push('Отсутствует кнопка для перехода');
        suggestions.push('Добавить кнопку перехода');
      }

      if (connectionsFromSource > 10) {
        errors.push('Слишком много связей от одного узла');
        suggestions.push('Разбить на несколько узлов');
      }

      const isValid = errors.length === 0;

      return {
        id: connection.id,
        strength,
        usage: Math.random() * 100, // В реальной системе это будет аналитика
        importance,
        hasButton: !!relatedButton,
        buttonType: relatedButton?.action,
        isValid,
        errors,
        suggestions
      } as ConnectionMetrics;
    });
  }, [connections, nodes]);

  // Фильтрация по режиму просмотра
  const filteredConnections = useMemo(() => {
    const filtered = connectionMetrics.filter(metrics => {
      switch (viewMode) {
        case 'strong':
          return metrics.strength >= 0.7;
        case 'weak':
          return metrics.strength < 0.5;
        case 'problematic':
          return !metrics.isValid;
        default:
          return true;
      }
    });

    return filtered.map(metrics => ({
      connection: connections.find(c => c.id === metrics.id)!,
      metrics
    }));
  }, [connectionMetrics, connections, viewMode]);

  // Получение цвета связи
  const getConnectionColor = useCallback((metrics: ConnectionMetrics) => {
    if (!metrics.isValid) return 'rgb(239, 68, 68)'; // red-500
    if (metrics.strength >= 0.8) return 'rgb(34, 197, 94)'; // green-500
    if (metrics.strength >= 0.6) return 'rgb(59, 130, 246)'; // blue-500
    if (metrics.strength >= 0.4) return 'rgb(245, 158, 11)'; // yellow-500
    return 'rgb(156, 163, 175)'; // gray-400
  }, []);

  // Получение толщины линии
  const getConnectionWidth = useCallback((metrics: ConnectionMetrics) => {
    return Math.max(1, Math.floor(metrics.strength * 5));
  }, []);

  // Получение названия узла
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

  // Получение иконки типа связи
  const getConnectionIcon = useCallback((metrics: ConnectionMetrics) => {
    if (!metrics.hasButton) return <ArrowRight className="h-4 w-4" />;
    
    switch (metrics.buttonType) {
      case 'command':
        return <Zap className="h-4 w-4" />;
      case 'url':
        return <Link className="h-4 w-4" />;
      default:
        return <MousePointer className="h-4 w-4" />;
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Панель управления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Визуализация связей
          </CardTitle>
          <CardDescription>
            Анализ и управление связями между узлами бота
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="flex gap-2 mb-4">
            <UIButton
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              Все связи
            </UIButton>
            <UIButton
              variant={viewMode === 'strong' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('strong')}
            >
              Сильные
            </UIButton>
            <UIButton
              variant={viewMode === 'weak' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weak')}
            >
              Слабые
            </UIButton>
            <UIButton
              variant={viewMode === 'problematic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('problematic')}
            >
              Проблемные
            </UIButton>
          </div>

          {/* Легенда */}
          <div className="flex flex-wrap gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded"></div>
              <span className="text-sm">Сильная связь</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500 rounded"></div>
              <span className="text-sm">Средняя связь</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-yellow-500 rounded"></div>
              <span className="text-sm">Слабая связь</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500 rounded"></div>
              <span className="text-sm">Проблемная связь</span>
            </div>
          </div>

          {/* Метрики */}
          {showMetrics && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredConnections.length}
                </div>
                <div className="text-sm text-muted-foreground">Показано связей</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredConnections.filter(({ metrics }) => metrics.isValid).length}
                </div>
                <div className="text-sm text-muted-foreground">Валидных</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {filteredConnections.filter(({ metrics }) => metrics.hasButton).length}
                </div>
                <div className="text-sm text-muted-foreground">С кнопками</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(filteredConnections.reduce((sum, { metrics }) => sum + metrics.strength, 0) / filteredConnections.length * 100) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Средняя сила</div>
              </div>
            </div>
          )}

          {/* Список связей */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <TooltipProvider>
              {filteredConnections.map(({ connection, metrics }) => (
                <Tooltip key={connection.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "p-3 border rounded-lg transition-all duration-200",
                        interactive && "cursor-pointer hover:bg-accent",
                        selectedConnectionId === connection.id && "bg-accent border-primary",
                        hoveredConnectionId === connection.id && "shadow-md",
                        !metrics.isValid && "border-red-200 bg-red-50 dark:bg-red-900/10"
                      )}
                      onClick={() => interactive && onConnectionSelect?.(connection)}
                      onMouseEnter={() => setHoveredConnectionId(connection.id)}
                      onMouseLeave={() => setHoveredConnectionId(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Иконка типа связи */}
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            {getConnectionIcon(metrics)}
                          </div>
                          
                          {/* Информация о связи */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {getNodeName(connection.source)} → {getNodeName(connection.target)}
                              </span>
                              
                              {/* Индикатор валидности */}
                              {metrics.isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            
                            {/* Прогресс-бар силы связи */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${metrics.strength * 100}%`,
                                  backgroundColor: getConnectionColor(metrics)
                                }}
                              />
                            </div>
                            
                            {/* Метрики */}
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Сила: {Math.round(metrics.strength * 100)}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Важность: {Math.round(metrics.importance * 100)}%
                              </Badge>
                              {metrics.hasButton && (
                                <Badge variant="secondary" className="text-xs">
                                  {metrics.buttonType === 'goto' ? 'Переход' : 
                                   metrics.buttonType === 'command' ? 'Команда' : 'Ссылка'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Действия */}
                        {interactive && (
                          <div className="flex gap-1">
                            <UIButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConnectionEdit?.(connection);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </UIButton>
                            <UIButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConnectionDelete?.(connection.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </UIButton>
                          </div>
                        )}
                      </div>
                      
                      {/* Ошибки и предложения */}
                      {(!metrics.isValid && metrics.errors.length > 0) && (
                        <div className="mt-2 space-y-1">
                          {metrics.errors.map((error, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {metrics.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {metrics.suggestions.map((suggestion, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              💡 {suggestion}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Связь {connection.id}</p>
                      <p className="text-sm">Сила: {Math.round(metrics.strength * 100)}%</p>
                      <p className="text-sm">Важность: {Math.round(metrics.importance * 100)}%</p>
                      {metrics.hasButton && (
                        <p className="text-sm">Тип кнопки: {metrics.buttonType}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}