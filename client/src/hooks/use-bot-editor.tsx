import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Connection, Button, BotData } from '@shared/schema';
import { applyTemplateLayout } from '@/utils/hierarchical-layout';
import { generateAutoTransitionConnections } from '@/utils/auto-transition-connections';

interface HistoryState {
  nodes: Node[];
  connections: Connection[];
}

export function useBotEditor(initialData?: BotData) {
  const [nodes, setNodes] = useState<Node[]>(initialData?.nodes || []);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Состояние для отслеживания перетаскивания узлов
  const [isNodeBeingDragged, setIsNodeBeingDragged] = useState(false);
  
  // История для undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isRedoUndoActionRef = useRef(false);

  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Сохранить текущее состояние в историю
  const saveToHistory = useCallback(() => {
    if (isRedoUndoActionRef.current) {
      return; // Не сохраняем состояние при undo/redo операциях
    }
    
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections))
    };
    
    setHistory(prev => {
      // Если мы не в конце истории, удаляем все состояния после текущего индекса
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      
      // Ограничиваем размер истории (максимум 50 состояний)
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, connections, historyIndex, history.length]);

  // Отменить последнее действие
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      
      isRedoUndoActionRef.current = true;
      setHistoryIndex(prevIndex);
      setSelectedNodeId(null);
      
      // Обновляем nodes и connections в следующем тике, чтобы избежать срабатывания useEffect
      setTimeout(() => {
        setNodes(prevState.nodes);
        setConnections(prevState.connections);
        // Сбрасываем флаг после обновления состояния
        setTimeout(() => { isRedoUndoActionRef.current = false; }, 100);
      }, 0);
    }
  }, [history, historyIndex]);

  // Повторить отмененное действие
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      
      isRedoUndoActionRef.current = true;
      setHistoryIndex(nextIndex);
      setSelectedNodeId(null);
      
      // Обновляем nodes и connections в следующем тике, чтобы избежать срабатывания useEffect
      setTimeout(() => {
        setNodes(nextState.nodes);
        setConnections(nextState.connections);
        // Сбрасываем флаг после обновления состояния
        setTimeout(() => { isRedoUndoActionRef.current = false; }, 100);
      }, 0);
    }
  }, [history, historyIndex]);

  // Проверяем, доступны ли операции undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Инициализируем историю при первой загрузке
  useEffect(() => {
    if (history.length === 0 && (nodes.length > 0 || connections.length > 0)) {
      const initialState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        connections: JSON.parse(JSON.stringify(connections))
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [nodes, connections, history.length]);

  // Сохраняем состояние в историю при изменении nodes или connections
  useEffect(() => {
    if (!isRedoUndoActionRef.current && history.length > 0) {
      const timeoutId = setTimeout(saveToHistory, 300); // Увеличен дебаунс для избежания частых сохранений
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, connections, saveToHistory, history.length]);

  // Автоматически генерируем соединения для узлов с autoTransitionTo
  useEffect(() => {
    if (!isRedoUndoActionRef.current && nodes.length > 0) {
      setConnections(prevConnections => {
        const updatedConnections = generateAutoTransitionConnections(nodes, prevConnections);
        
        // Всегда обновляем если длина изменилась
        if (updatedConnections.length !== prevConnections.length) {
          console.log('🔗 Автопереходы обновлены:', updatedConnections.filter(c => c.isAutoGenerated));
          return updatedConnections;
        }
        
        // Проверяем изменения в автопереходах
        const hasChanges = updatedConnections.some((conn, index) => {
          const prevConn = prevConnections[index];
          return !prevConn || conn.id !== prevConn.id || 
                 conn.source !== prevConn.source || 
                 conn.target !== prevConn.target ||
                 conn.isAutoGenerated !== prevConn.isAutoGenerated;
        });
        
        if (hasChanges) {
          console.log('🔗 Автопереходы изменены:', updatedConnections.filter(c => c.isAutoGenerated));
        }
        
        return hasChanges ? updatedConnections : prevConnections;
      });
    }
  }, [nodes, connections]);

  const addNode = useCallback((node: Node) => {
    setNodes(prev => [...prev, node]);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const addConnection = useCallback((connection: Connection) => {
    setConnections(prev => [...prev, connection]);
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    let wasDeleted = false;
    setConnections(prev => {
      const connToDelete = prev.find(c => c.id === connectionId);
      if (connToDelete?.isAutoGenerated) {
        console.warn('Попытка удалить автогенерированное соединение. Измените свойство autoTransitionTo узла.');
        return prev;
      }
      wasDeleted = true;
      return prev.filter(conn => conn.id !== connectionId);
    });
    return wasDeleted;
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<Node['data']>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  }, []);

  const addButton = useCallback((nodeId: string, button: Button) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              buttons: [...(node.data.buttons || []), button] 
            } 
          }
        : node
    ));
  }, []);

  const updateButton = useCallback((nodeId: string, buttonId: string, updates: Partial<Button>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              buttons: (node.data.buttons || []).map(btn => 
                btn.id === buttonId ? { ...btn, ...updates } : btn
              )
            } 
          }
        : node
    ));
  }, []);

  const deleteButton = useCallback((nodeId: string, buttonId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              buttons: (node.data.buttons || []).filter(btn => btn.id !== buttonId)
            } 
          }
        : node
    ));
  }, []);

  const updateNodes = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  // Функция нормализации данных узла (клиентская версия серверной нормализации)
  const normalizeNodeData = useCallback((node: Node): Node => {
    if (!node || !node.type) return node;

    const normalizedData = { ...node.data };

    // Дефолтные поля для всех узлов
    const defaultFields = {
      buttons: [],
      messageText: '',
      keyboardType: 'none',
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      markdown: false,
      isPrivateOnly: false,
      adminOnly: false,
      requiresAuth: false,
      showInMenu: true,
      enableStatistics: true
    };

    // Применяем дефолтные поля
    for (const [key, value] of Object.entries(defaultFields)) {
      if ((normalizedData as any)[key] === undefined) {
        (normalizedData as any)[key] = value;
      }
    }

    // Специфичные поля для команд start и command
    if (node.type === 'start' || node.type === 'command') {
      if (!normalizedData.command) {
        normalizedData.command = node.type === 'start' ? '/start' : '/command';
      }
      if (!normalizedData.description) {
        normalizedData.description = node.type === 'start' ? 'Запустить бота' : 'Команда бота';
      }
    }

    return {
      ...node,
      data: normalizedData
    };
  }, []);

  const setBotData = useCallback((
    botData: BotData, 
    templateName?: string, 
    nodeSizes?: Map<string, { width: number; height: number }>,
    skipLayout?: boolean // Новый параметр для отключения автоматического layout
  ) => {
    // Устанавливаем данные бота
    
    // Нормализуем узлы перед применением компоновки
    const normalizedNodes = (botData.nodes || []).map(normalizeNodeData);
    
    // ИСПРАВЛЕНИЕ: Генерируем автопереходы ДО применения layout
    const connectionsWithAuto = generateAutoTransitionConnections(
      normalizedNodes, 
      botData.connections || []
    );
    
    // Применяем иерархическую компоновку только если не отключена
    const finalNodes = skipLayout 
      ? normalizedNodes 
      : applyTemplateLayout(normalizedNodes, connectionsWithAuto, templateName, nodeSizes);
    
    setNodes(finalNodes);
    setConnections(connectionsWithAuto);
    setSelectedNodeId(null); // Сбрасываем выбранный узел
    
    // setBotData завершен
  }, [normalizeNodeData]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(node => node.id === nodeId);
    if (!nodeToDuplicate) return;

    // Создаем копию узла с новым ID и смещенной позицией
    const duplicatedNode: Node = {
      ...JSON.parse(JSON.stringify(nodeToDuplicate)), // Глубокое копирование
      id: `${nodeId}_copy_${Date.now()}`, // Новый уникальный ID
      position: {
        x: nodeToDuplicate.position.x + 50, // Смещение вправо
        y: nodeToDuplicate.position.y + 50  // Смещение вниз
      }
    };

    setNodes(prev => [...prev, duplicatedNode]);
    setSelectedNodeId(duplicatedNode.id); // Выбираем скопированный узел
  }, [nodes]);

  const duplicateNodes = useCallback((nodeIds: string[]) => {
    const nodesToDuplicate = nodes.filter(node => nodeIds.includes(node.id));
    if (nodesToDuplicate.length === 0) return;

    const idMapping: { [oldId: string]: string } = {};
    const duplicatedNodes: Node[] = [];

    // Создаем копии узлов с новыми ID
    nodesToDuplicate.forEach(node => {
      const newId = `${node.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMapping[node.id] = newId;

      const duplicatedNode: Node = {
        ...JSON.parse(JSON.stringify(node)), // Глубокое копирование
        id: newId,
        position: {
          x: node.position.x + 50, // Смещение вправо
          y: node.position.y + 50  // Смещение вниз
        }
      };

      duplicatedNodes.push(duplicatedNode);
    });

    // Копируем связи между дублированными узлами
    const duplicatedConnections: Connection[] = [];
    connections.forEach(connection => {
      const sourceId = idMapping[connection.source];
      const targetId = idMapping[connection.target];
      
      // Создаем связь только если оба узла были скопированы
      if (sourceId && targetId) {
        const duplicatedConnection: Connection = {
          ...JSON.parse(JSON.stringify(connection)), // Глубокое копирование
          id: `${connection.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: sourceId,
          target: targetId
        };
        duplicatedConnections.push(duplicatedConnection);
      }
    });

    setNodes(prev => [...prev, ...duplicatedNodes]);
    setConnections(prev => [...prev, ...duplicatedConnections]);
    
    // Выбираем первый скопированный узел
    if (duplicatedNodes.length > 0) {
      setSelectedNodeId(duplicatedNodes[0].id);
    }
  }, [nodes, connections]);

  const getBotData = useCallback((): BotData => ({
    nodes,
    connections
  }), [nodes, connections]);

  // Копирование элементов в буфер обмена для вставки в другие проекты
  const copyToClipboard = useCallback((nodeIds: string[]) => {
    const nodesToCopy = nodes.filter(node => nodeIds.includes(node.id));
    const connectionsToCopy = connections.filter(conn => 
      nodeIds.includes(conn.source) && nodeIds.includes(conn.target)
    );

    const clipboardData = {
      nodes: nodesToCopy,
      connections: connectionsToCopy,
      timestamp: Date.now(),
      projectType: 'telegram-bot'
    };

    // Сохраняем в localStorage для межпроектного буфера обмена
    localStorage.setItem('bot-clipboard', JSON.stringify(clipboardData));
    
    return clipboardData;
  }, [nodes, connections]);

  // Вставка элементов из буфера обмена
  const pasteFromClipboard = useCallback((offsetX: number = 100, offsetY: number = 100) => {
    try {
      const clipboardDataStr = localStorage.getItem('bot-clipboard');
      if (!clipboardDataStr) return false;

      const clipboardData = JSON.parse(clipboardDataStr);
      
      // Проверяем что данные корректны и не слишком старые (24 часа)
      if (!clipboardData.nodes || !Array.isArray(clipboardData.nodes) || 
          !clipboardData.timestamp || Date.now() - clipboardData.timestamp > 24 * 60 * 60 * 1000) {
        return false;
      }

      const idMapping: { [oldId: string]: string } = {};
      const pastedNodes: Node[] = [];

      // Создаем новые ID для всех узлов
      clipboardData.nodes.forEach((node: Node) => {
        const newId = `${node.id}_paste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMapping[node.id] = newId;

        const pastedNode: Node = {
          ...JSON.parse(JSON.stringify(node)),
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY
          }
        };

        pastedNodes.push(pastedNode);
      });

      // Создаем новые связи с обновленными ID
      const pastedConnections: Connection[] = [];
      clipboardData.connections.forEach((connection: Connection) => {
        const sourceId = idMapping[connection.source];
        const targetId = idMapping[connection.target];
        
        if (sourceId && targetId) {
          const pastedConnection: Connection = {
            ...JSON.parse(JSON.stringify(connection)),
            id: `${connection.id}_paste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: sourceId,
            target: targetId
          };
          pastedConnections.push(pastedConnection);
        }
      });

      // Добавляем элементы на холст
      setNodes(prev => [...prev, ...pastedNodes]);
      setConnections(prev => [...prev, ...pastedConnections]);

      // Выбираем первый вставленный узел
      if (pastedNodes.length > 0) {
        setSelectedNodeId(pastedNodes[0].id);
      }

      return true;
    } catch (error) {
      console.error('Ошибка при вставке из буфера обмена:', error);
      return false;
    }
  }, []);

  // Проверка наличия данных в буфере обмена
  const hasClipboardData = useCallback(() => {
    try {
      const clipboardDataStr = localStorage.getItem('bot-clipboard');
      if (!clipboardDataStr) return false;

      const clipboardData = JSON.parse(clipboardDataStr);
      return !!(clipboardData.nodes && Array.isArray(clipboardData.nodes) && 
               clipboardData.nodes.length > 0 && clipboardData.timestamp &&
               Date.now() - clipboardData.timestamp <= 24 * 60 * 60 * 1000);
    } catch {
      return false;
    }
  }, []);

  return {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    duplicateNodes,
    addConnection,
    deleteConnection,
    updateConnection,
    updateNodeData,
    addButton,
    updateButton,
    deleteButton,
    updateNodes,
    setBotData,
    getBotData,
    undo,
    redo,
    canUndo,
    canRedo,
    copyToClipboard,
    pasteFromClipboard,
    hasClipboardData,
    isNodeBeingDragged,
    setIsNodeBeingDragged
  };
}
