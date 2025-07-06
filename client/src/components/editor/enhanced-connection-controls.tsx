import React, { useState, useCallback, useMemo } from 'react';
import { Node, Connection, Button } from '@/types/bot';
import { Badge } from '@/components/ui/badge';
import { Button as UIButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Link, 
  Plus, 
  Settings, 
  Trash2, 
  Edit3, 
  Target, 
  ArrowRight,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { ConnectionManager } from '@/utils/connection-manager';
import { cn } from '@/lib/utils';

interface EnhancedConnectionControlsProps {
  nodes: Node[];
  connections: Connection[];
  onConnectionsChange: (connections: Connection[]) => void;
  onNodesChange: (nodes: Node[]) => void;
  selectedConnection?: Connection;
  onConnectionSelect?: (connection: Connection | null) => void;
  autoButtonCreation: boolean;
  onAutoButtonCreationChange: (enabled: boolean) => void;
}

interface ConnectionRule {
  id: string;
  name: string;
  description: string;
  sourceTypes: Node['type'][];
  targetTypes: Node['type'][];
  maxConnections: number;
  requiresButton: boolean;
  autoApply: boolean;
  priority: number;
}

const defaultRules: ConnectionRule[] = [
  {
    id: 'start-to-content',
    name: 'Стартовые переходы',
    description: 'Узел "Старт" должен вести к контенту',
    sourceTypes: ['start'],
    targetTypes: ['message', 'keyboard', 'photo'],
    maxConnections: 3,
    requiresButton: true,
    autoApply: true,
    priority: 1
  },
  {
    id: 'command-response',
    name: 'Ответы на команды',
    description: 'Команды должны иметь ответные действия',
    sourceTypes: ['command'],
    targetTypes: ['message', 'keyboard', 'photo'],
    maxConnections: 5,
    requiresButton: false,
    autoApply: true,
    priority: 2
  },
  {
    id: 'interactive-flow',
    name: 'Интерактивный поток',
    description: 'Интерактивные элементы должны иметь следующие шаги',
    sourceTypes: ['keyboard', 'input'],
    targetTypes: ['message', 'condition'],
    maxConnections: 10,
    requiresButton: true,
    autoApply: false,
    priority: 3
  }
];

export function EnhancedConnectionControls({
  nodes,
  connections,
  onConnectionsChange,
  onNodesChange,
  selectedConnection,
  onConnectionSelect,
  autoButtonCreation,
  onAutoButtonCreationChange
}: EnhancedConnectionControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rules, setRules] = useState<ConnectionRule[]>(defaultRules);
  const [activeRule, setActiveRule] = useState<ConnectionRule | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const connectionManager = useMemo(() => 
    new ConnectionManager({
      nodes,
      connections,
      autoButtonCreation
    }),
    [nodes, connections, autoButtonCreation]
  );

  // Анализ связей по правилам
  const connectionAnalysis = useMemo(() => {
    const analysis = connections.map(connection => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) {
        return {
          connection,
          isValid: false,
          violations: ['Отсутствует исходный или целевой узел'],
          suggestions: []
        };
      }

      const violations: string[] = [];
      const suggestions: string[] = [];
      
      // Проверка по правилам
      const applicableRules = rules.filter(rule => 
        rule.sourceTypes.includes(sourceNode.type) && 
        rule.targetTypes.includes(targetNode.type)
      );

      if (applicableRules.length === 0) {
        violations.push('Нет подходящих правил для этого типа связи');
      }

      applicableRules.forEach(rule => {
        const connectionsFromSource = connections.filter(c => c.source === connection.source);
        
        if (connectionsFromSource.length > rule.maxConnections) {
          violations.push(`Превышено максимальное количество связей (${rule.maxConnections})`);
        }

        if (rule.requiresButton) {
          const hasButton = sourceNode.data.buttons.some(b => 
            b.action === 'goto' && b.target === connection.target
          );
          if (!hasButton) {
            violations.push('Требуется кнопка для этой связи');
            suggestions.push('Добавить кнопку перехода');
          }
        }
      });

      return {
        connection,
        isValid: violations.length === 0,
        violations,
        suggestions
      };
    });

    return analysis;
  }, [connections, nodes, rules]);

  // Фильтрация связей
  const filteredConnections = useMemo(() => {
    return connectionAnalysis.filter(analysis => {
      if (filterType === 'valid' && !analysis.isValid) return false;
      if (filterType === 'invalid' && analysis.isValid) return false;
      
      if (searchTerm) {
        const sourceNode = nodes.find(n => n.id === analysis.connection.source);
        const targetNode = nodes.find(n => n.id === analysis.connection.target);
        const searchLower = searchTerm.toLowerCase();
        
        return (
          sourceNode?.type.toLowerCase().includes(searchLower) ||
          targetNode?.type.toLowerCase().includes(searchLower) ||
          analysis.violations.some(v => v.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [connectionAnalysis, filterType, searchTerm, nodes]);

  // Статистика
  const stats = useMemo(() => {
    const total = connections.length;
    const valid = connectionAnalysis.filter(a => a.isValid).length;
    const invalid = total - valid;
    const withButtons = connectionAnalysis.filter(a => {
      const sourceNode = nodes.find(n => n.id === a.connection.source);
      return sourceNode?.data.buttons.some(b => 
        b.action === 'goto' && b.target === a.connection.target
      );
    }).length;

    return { total, valid, invalid, withButtons };
  }, [connectionAnalysis, nodes]);

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

  const fixConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return;

    connectionManager.updateState({ nodes, connections });
    
    // Проверяем, нужна ли кнопка
    const needsButton = rules.some(rule => 
      rule.sourceTypes.includes(sourceNode.type) && 
      rule.targetTypes.includes(targetNode.type) &&
      rule.requiresButton
    );

    if (needsButton) {
      const hasButton = sourceNode.data.buttons.some(b => 
        b.action === 'goto' && b.target === connection.target
      );

      if (!hasButton) {
        const { updatedNodes } = connectionManager.createConnection(
          connection.source,
          connection.target,
          { autoCreateButton: true }
        );
        onNodesChange(updatedNodes);
      }
    }
  }, [connectionManager, nodes, connections, rules, onNodesChange]);

  const deleteConnection = useCallback((connectionId: string) => {
    connectionManager.updateState({ nodes, connections });
    const { removedConnection, updatedNodes } = connectionManager.removeConnection(connectionId);
    
    if (removedConnection) {
      onConnectionsChange(connections.filter(c => c.id !== connectionId));
      onNodesChange(updatedNodes);
      
      if (selectedConnection?.id === connectionId) {
        onConnectionSelect?.(null);
      }
    }
  }, [connectionManager, nodes, connections, onConnectionsChange, onNodesChange, selectedConnection, onConnectionSelect]);

  const applyRule = useCallback((rule: ConnectionRule) => {
    connectionManager.updateState({ nodes, connections });
    
    const sourceNodes = nodes.filter(n => rule.sourceTypes.includes(n.type));
    const targetNodes = nodes.filter(n => rule.targetTypes.includes(n.type));
    
    const newConnections: Connection[] = [];
    let updatedNodes = [...nodes];

    sourceNodes.forEach(sourceNode => {
      const existingConnections = connections.filter(c => c.source === sourceNode.id);
      const availableSlots = rule.maxConnections - existingConnections.length;
      
      if (availableSlots > 0) {
        const suitableTargets = targetNodes.filter(targetNode => 
          targetNode.id !== sourceNode.id &&
          !existingConnections.some(c => c.target === targetNode.id)
        ).slice(0, availableSlots);

        suitableTargets.forEach(targetNode => {
          const { connection, updatedNodes: newUpdatedNodes } = connectionManager.createConnection(
            sourceNode.id,
            targetNode.id,
            { autoCreateButton: rule.requiresButton }
          );
          
          newConnections.push(connection);
          updatedNodes = newUpdatedNodes;
        });
      }
    });

    if (newConnections.length > 0) {
      onConnectionsChange([...connections, ...newConnections]);
      onNodesChange(updatedNodes);
    }
  }, [connectionManager, nodes, connections, onConnectionsChange, onNodesChange]);

  const validateAllConnections = useCallback(() => {
    connectionManager.updateState({ nodes, connections });
    const updatedNodes = connectionManager.syncButtonsWithConnections();
    onNodesChange(updatedNodes);
  }, [connectionManager, nodes, connections, onNodesChange]);

  return (
    <div className="space-y-4">
      {/* Панель управления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Расширенное управление связями
          </CardTitle>
          <CardDescription>
            Контроль качества и автоматизация связей между узлами
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Статистика */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего связей</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.valid}</div>
              <div className="text-sm text-muted-foreground">Валидных</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.invalid}</div>
              <div className="text-sm text-muted-foreground">Требуют внимания</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.withButtons}</div>
              <div className="text-sm text-muted-foreground">С кнопками</div>
            </div>
          </div>

          {/* Фильтры и поиск */}
          <div className="flex gap-2 mb-4">
            <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все связи</SelectItem>
                <SelectItem value="valid">Валидные</SelectItem>
                <SelectItem value="invalid">Требуют внимания</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по типам узлов или проблемам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <UIButton variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки
                </UIButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Настройки правил связей</DialogTitle>
                  <DialogDescription>
                    Управление правилами валидации и автоматического создания связей
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-button-creation">Автоматическое создание кнопок</Label>
                    <Switch
                      id="auto-button-creation"
                      checked={autoButtonCreation}
                      onCheckedChange={onAutoButtonCreationChange}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Правила валидации</h4>
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{rule.name}</h5>
                          <div className="flex gap-2">
                            <UIButton
                              variant="outline"
                              size="sm"
                              onClick={() => applyRule(rule)}
                              disabled={!rule.autoApply}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Применить
                            </UIButton>
                            <Switch
                              checked={rule.autoApply}
                              onCheckedChange={(checked) => {
                                setRules(prev => prev.map(r => 
                                  r.id === rule.id ? { ...r, autoApply: checked } : r
                                ));
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            Макс. связей: {rule.maxConnections}
                          </Badge>
                          {rule.requiresButton && (
                            <Badge variant="secondary">Требует кнопки</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Инструменты */}
          <div className="flex gap-2 mb-4">
            <UIButton onClick={validateAllConnections} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Синхронизировать все
            </UIButton>
            <UIButton 
              onClick={() => {
                rules.filter(r => r.autoApply).forEach(applyRule);
              }}
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              Применить автоправила
            </UIButton>
          </div>

          {/* Список связей */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredConnections.map(({ connection, isValid, violations, suggestions }) => (
              <div
                key={connection.id}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent",
                  selectedConnection?.id === connection.id && "bg-accent border-primary",
                  !isValid && "border-red-200 bg-red-50 dark:bg-red-900/10"
                )}
                onClick={() => onConnectionSelect?.(connection)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {getNodeName(connection.source)} → {getNodeName(connection.target)}
                      </span>
                    </div>
                    
                    {violations.length > 0 && (
                      <div className="space-y-1">
                        {violations.map((violation, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">{violation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {suggestions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {suggestions.map((suggestion, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    {!isValid && (
                      <UIButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fixConnection(connection);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </UIButton>
                    )}
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}