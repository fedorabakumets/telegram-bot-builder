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
      const relatedButton = sourceNode.data.buttons?.find(b => 
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
    
    const typeNames: Record<string, string> = {
      start: 'Старт',
      command: node.data.command || 'Команда',
      message: 'Сообщение',
      keyboard: 'Клавиатура',
      photo: 'Фото',
      video: 'Видео',
      audio: 'Аудио',
      document: 'Документ',
      condition: 'Условие',
      input: 'Ввод',
      'user-input': 'Пользовательский ввод',
      sticker: 'Стикер',
      voice: 'Голосовое',
      animation: 'Анимация',
      location: 'Геолокация',
      contact: 'Контакт',
      poll: 'Опрос',
      dice: 'Кубик',
      pin_message: 'Закрепить сообщение',
      unpin_message: 'Открепить сообщение',
      delete_message: 'Удалить сообщение',
      ban_user: 'Забанить пользователя',
      unban_user: 'Разбанить пользователя',
      mute_user: 'Замутить пользователя',
      unmute_user: 'Размутить пользователя',
      kick_user: 'Кикнуть пользователя',
      promote_user: 'Повысить пользователя',
      demote_user: 'Понизить пользователя',
      admin_rights: 'Права администратора'
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

  // ВРЕМЕННО ОТКЛЮЧЕНО: Визуализация и анализ связей
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Визуализация связей
          </CardTitle>
          <CardDescription>
            Временно отключена
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-link-slash text-3xl text-amber-600 dark:text-amber-400"></i>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Визуализация связей временно отключена
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                Связи между узлами сохраняются в данных проекта, но их визуализация и анализ временно недоступны
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="text-xs">
                  {connections.length} {connections.length === 1 ? 'связь' : connections.length > 1 && connections.length < 5 ? 'связи' : 'связей'} в проекте
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // АРХИВ: Оригинальная визуализация связей (временно отключена)
  // Код сохранен в client/src/components/_archive/connection-visualization.tsx.bak
}
