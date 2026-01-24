import React, { useState, useCallback, useMemo } from 'react';
import { Node, Connection, Button } from '@/types/bot';
import { Badge } from '@/components/ui/badge';
import { Button as UIButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Zap,
  Target,
  Lightbulb,
  CheckCircle,
  XCircle,
  Settings,
  Brain,
  Wand2,
  Sparkles
} from 'lucide-react';
import { ConnectionManager, ConnectionSuggestion } from '@/utils/connection-manager';
import { cn } from '@/lib/utils';

interface SmartConnectionCreatorProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionAdd: (connection: Connection) => void;
  onNodesChange: (nodes: Node[]) => void;
  autoButtonCreation: boolean;
  selectedNodeId?: string;
}

interface ConnectionTemplate {
  id: string;
  name: string;
  description: string;
  sourceTypes: Node['type'][];
  targetTypes: Node['type'][];
  buttonTemplate: Partial<Button>;
  priority: number;
  useCase: string;
}

const connectionTemplates: ConnectionTemplate[] = [
  {
    id: 'start-welcome',
    name: 'Стартовое приветствие',
    description: 'Переход от старта к приветственному сообщению',
    sourceTypes: ['start'],
    targetTypes: ['message'],
    buttonTemplate: {
      text: '👋 Начать',
      action: 'goto'
    },
    priority: 1,
    useCase: 'Первый контакт с пользователем'
  },
  {
    id: 'menu-navigation',
    name: 'Навигация по меню',
    description: 'Переход от сообщения к интерактивному меню',
    sourceTypes: ['message'],
    targetTypes: ['keyboard'],
    buttonTemplate: {
      text: '📋 Меню',
      action: 'goto'
    },
    priority: 2,
    useCase: 'Предоставление вариантов выбора'
  },
  {
    id: 'command-response',
    name: 'Ответ на команду',
    description: 'Автоматический ответ на команду пользователя',
    sourceTypes: ['command'],
    targetTypes: ['message', 'photo'],
    buttonTemplate: {
      text: '✅ Выполнить',
      action: 'command'
    },
    priority: 3,
    useCase: 'Обработка команд пользователя'
  },
  {
    id: 'input-processing',
    name: 'Обработка ввода',
    description: 'Переход от ввода к обработке данных',
    sourceTypes: ['input'],
    targetTypes: ['message', 'condition'],
    buttonTemplate: {
      text: '💾 Сохранить',
      action: 'goto'
    },
    priority: 4,
    useCase: 'Сбор и обработка пользовательских данных'
  },
  {
    id: 'media-showcase',
    name: 'Демонстрация медиа',
    description: 'Переход к отображению фото или медиаконтента',
    sourceTypes: ['message', 'keyboard'],
    targetTypes: ['photo'],
    buttonTemplate: {
      text: '🖼️ Показать',
      action: 'goto'
    },
    priority: 5,
    useCase: 'Представление визуального контента'
  }
];

export function SmartConnectionCreator({
  nodes,
  connections,
  onConnectionAdd,
  onNodesChange,
  autoButtonCreation,
  selectedNodeId
}: SmartConnectionCreatorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'templates' | 'smart'>('smart');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(selectedNodeId || '');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [buttonText, setButtonText] = useState('');
  const [buttonAction, setButtonAction] = useState<'goto' | 'command' | 'url'>('goto');
  const [smartSuggestions, setSmartSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [isGeneratingSmartSuggestions, setIsGeneratingSmartSuggestions] = useState(false);

  const connectionManager = useMemo(() =>
    new ConnectionManager({
      nodes,
      connections,
      autoButtonCreation
    }),
    [nodes, connections, autoButtonCreation]
  );

  // Анализ недостающих связей
  const missingConnections = useMemo(() => {
    const orphanedNodes = nodes.filter(node => {
      const hasIncoming = connections.some(conn => conn.target === node.id);
      const hasOutgoing = connections.some(conn => conn.source === node.id);

      if (node.type === 'start') return !hasOutgoing;
      if (node.type === 'command') return !hasOutgoing;
      return !hasIncoming && !hasOutgoing;
    });

    return orphanedNodes;
  }, [nodes, connections]);

  // Подходящие шаблоны для выбранного узла
  const applicableTemplates = useMemo(() => {
    if (!selectedSourceId) return connectionTemplates;

    const sourceNode = nodes.find(n => n.id === selectedSourceId);
    if (!sourceNode) return [];

    return connectionTemplates.filter(template =>
      template.sourceTypes.includes(sourceNode.type)
    );
  }, [selectedSourceId, nodes]);

  // Доступные узлы для подключения
  const availableTargets = useMemo(() => {
    if (!selectedSourceId) return nodes;

    const existingTargets = new Set(
      connections
        .filter(conn => conn.source === selectedSourceId)
        .map(conn => conn.target)
    );

    return nodes.filter(node =>
      node.id !== selectedSourceId && !existingTargets.has(node.id)
    );
  }, [selectedSourceId, nodes, connections]);

  const getNodeName = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'Неизвестный узел';

    const typeNames: Record<Node['type'], string> = {
      start: 'Старт',
      command: node.data.command || 'Команда',
      message: 'Сообщение',
      keyboard: 'Клавиатура',
      photo: 'Фото',
      video: 'Видео',
      audio: 'Аудио',
      document: 'Документ',
      sticker: 'Стикер',
      voice: 'Голос',
      animation: 'Анимация',
      location: 'Геолокация',
      contact: 'Контакт',
      pin_message: 'Закрепить',
      unpin_message: 'Открепить',
      delete_message: 'Удалить',
      ban_user: 'Заблокировать',
      unban_user: 'Разблокировать',
      mute_user: 'Заглушить',
      unmute_user: 'Включить звук',
      kick_user: 'Исключить',
      promote_user: 'Повысить',
      demote_user: 'Понизить',
      admin_rights: 'Права админа',
      condition: 'Условие',
      input: 'Ввод'
    };

    return typeNames[node.type] || node.type;
  }, [nodes]);

  const generateSmartSuggestions = useCallback(async () => {
    setIsGeneratingSmartSuggestions(true);
    try {
      connectionManager.updateState({ nodes, connections });
      const suggestions = connectionManager.generateConnectionSuggestions();
      setSmartSuggestions(suggestions.slice(0, 10)); // Топ 10 предложений
    } finally {
      setIsGeneratingSmartSuggestions(false);
    }
  }, [connectionManager, nodes, connections]);

  const createManualConnection = useCallback(() => {
    if (!selectedSourceId || !selectedTargetId) return;

    try {
      const { connection, updatedNodes } = connectionManager.createConnection(
        selectedSourceId,
        selectedTargetId,
        {
          autoCreateButton: autoButtonCreation,
          buttonText: buttonText || undefined,
          buttonAction: buttonAction
        }
      );

      onConnectionAdd(connection);
      onNodesChange(updatedNodes);

      // Сброс формы
      setSelectedTargetId('');
      setButtonText('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при создании связи:', error);
    }
  }, [
    selectedSourceId,
    selectedTargetId,
    buttonText,
    buttonAction,
    connectionManager,
    autoButtonCreation,
    onConnectionAdd,
    onNodesChange
  ]);

  const applyTemplate = useCallback((template: ConnectionTemplate) => {
    if (!selectedSourceId) return;

    const sourceNode = nodes.find(n => n.id === selectedSourceId);
    if (!sourceNode) return;

    const suitableTargets = availableTargets.filter(node =>
      template.targetTypes.includes(node.type)
    );

    if (suitableTargets.length === 0) return;

    const targetNode = suitableTargets[0]; // Выбираем первый подходящий

    try {
      const { connection, updatedNodes } = connectionManager.createConnection(
        selectedSourceId,
        targetNode.id,
        {
          autoCreateButton: true,
          buttonText: template.buttonTemplate.text,
          buttonAction: (template.buttonTemplate.action && ['goto', 'command', 'url'].includes(template.buttonTemplate.action))
            ? template.buttonTemplate.action as 'goto' | 'command' | 'url'
            : 'goto'
        }
      );

      onConnectionAdd(connection);
      onNodesChange(updatedNodes);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при применении шаблона:', error);
    }
  }, [selectedSourceId, nodes, availableTargets, connectionManager, onConnectionAdd, onNodesChange]);

  const applySuggestion = useCallback((suggestion: ConnectionSuggestion) => {
    try {
      const { connection, updatedNodes } = connectionManager.createConnection(
        suggestion.connection.source,
        suggestion.connection.target,
        {
          autoCreateButton: autoButtonCreation,
          buttonText: suggestion.suggestedButton.text,
          buttonAction: (suggestion.suggestedButton.action && ['goto', 'command', 'url'].includes(suggestion.suggestedButton.action))
            ? suggestion.suggestedButton.action as 'goto' | 'command' | 'url'
            : 'goto'
        }
      );

      onConnectionAdd(connection);
      onNodesChange(updatedNodes);

      // Удаляем примененное предложение
      setSmartSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Ошибка при применении предложения:', error);
    }
  }, [connectionManager, autoButtonCreation, onConnectionAdd, onNodesChange]);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  }, []);

  return (
    <div className="space-y-4">
      {/* Статистика и быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Умное создание связей
          </CardTitle>
          <CardDescription>
            Интеллектуальный анализ и автоматическое создание связей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {connections.length}
              </div>
              <div className="text-sm text-muted-foreground">Всего связей</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {missingConnections.length}
              </div>
              <div className="text-sm text-muted-foreground">Изолированных узлов</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {smartSuggestions.length}
              </div>
              <div className="text-sm text-muted-foreground">Предложений</div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="flex gap-2 mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <UIButton>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать связь
                </UIButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Создание новой связи</DialogTitle>
                  <DialogDescription>
                    Выберите способ создания связи между узлами
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="smart">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Умные предложения
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Шаблоны
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                      <Settings className="h-4 w-4 mr-2" />
                      Вручную
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="smart" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Автоматические предложения на основе анализа структуры бота
                      </p>
                      <UIButton
                        onClick={generateSmartSuggestions}
                        disabled={isGeneratingSmartSuggestions}
                        variant="outline"
                      >
                        {isGeneratingSmartSuggestions ? 'Генерация...' : 'Обновить'}
                      </UIButton>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {smartSuggestions.map((suggestion) => (
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
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Применить
                            </UIButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-source">Исходный узел</Label>
                      <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите исходный узел" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {getNodeName(node.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {applicableTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Приоритет: {template.priority}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.useCase}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.buttonTemplate.text}
                            </Badge>
                          </div>

                          <UIButton
                            size="sm"
                            onClick={() => applyTemplate(template)}
                            disabled={!selectedSourceId}
                            className="w-full"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Применить шаблон
                          </UIButton>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="source-node">Исходный узел</Label>
                        <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите исходный узел" />
                          </SelectTrigger>
                          <SelectContent>
                            {nodes.map(node => (
                              <SelectItem key={node.id} value={node.id}>
                                {getNodeName(node.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target-node">Целевой узел</Label>
                        <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите целевой узел" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTargets.map(node => (
                              <SelectItem key={node.id} value={node.id}>
                                {getNodeName(node.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="button-text">Текст кнопки (необязательно)</Label>
                        <Input
                          id="button-text"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          placeholder="Автоматически сгенерируется"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="button-action">Тип действия кнопки</Label>
                        <Select value={buttonAction} onValueChange={(value: typeof buttonAction) => setButtonAction(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="goto">Переход</SelectItem>
                            <SelectItem value="command">Команда</SelectItem>
                            <SelectItem value="url">Ссылка</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <UIButton
                        onClick={createManualConnection}
                        disabled={!selectedSourceId || !selectedTargetId}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Создать связь
                      </UIButton>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <UIButton
              onClick={generateSmartSuggestions}
              disabled={isGeneratingSmartSuggestions}
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Предложения
            </UIButton>
          </div>

          {/* Предупреждения */}
          {missingConnections.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Найдены изолированные узлы
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                {missingConnections.length} узлов не имеют связей и могут быть недоступны для пользователей
              </p>
              <div className="flex flex-wrap gap-1">
                {missingConnections.map(node => (
                  <Badge key={node.id} variant="outline" className="text-xs">
                    {getNodeName(node.id)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}