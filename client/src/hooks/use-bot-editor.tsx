import { useState, useCallback, useEffect } from 'react';
import { Node, Connection, Button, BotData } from '@shared/schema';
import { useHistory } from './use-history';

export function useBotEditor(initialData?: BotData) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Используем систему истории для узлов и связей
  const [historyState, pushToHistory, undo, redo, resetHistory] = useHistory<BotData>(
    { nodes: initialData?.nodes || [], connections: initialData?.connections || [] },
    { maxHistorySize: 50, debounceMs: 300 }
  );

  const { nodes, connections } = historyState.current;
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Функция для обновления состояния с историей
  const updateBotData = useCallback((
    updater: (prevData: BotData) => BotData,
    description?: string
  ) => {
    const newData = updater(historyState.current);
    pushToHistory(newData, description);
  }, [historyState.current, pushToHistory]);

  const addNode = useCallback((node: Node) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: [...prevData.nodes, node]
      }),
      `Добавлен узел: ${node.type}`
    );
  }, [updateBotData]);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }),
      `Обновлен узел`
    );
  }, [updateBotData]);

  const deleteNode = useCallback((nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    updateBotData(
      (prevData) => ({
        nodes: prevData.nodes.filter(node => node.id !== nodeId),
        connections: prevData.connections.filter(conn => 
          conn.source !== nodeId && conn.target !== nodeId
        )
      }),
      `Удален узел: ${nodeToDelete?.type || 'unknown'}`
    );
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [updateBotData, nodes, selectedNodeId]);

  const addConnection = useCallback((connection: Connection) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        connections: [...prevData.connections, connection]
      }),
      `Добавлена связь`
    );
  }, [updateBotData]);

  const deleteConnection = useCallback((connectionId: string) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        connections: prevData.connections.filter(conn => conn.id !== connectionId)
      }),
      `Удалена связь`
    );
  }, [updateBotData]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<Node['data']>) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      }),
      `Обновлены данные узла`
    );
  }, [updateBotData]);

  const addButton = useCallback((nodeId: string, button: Button) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  buttons: [...node.data.buttons, button] 
                } 
              }
            : node
        )
      }),
      `Добавлена кнопка: ${button.text}`
    );
  }, [updateBotData]);

  const updateButton = useCallback((nodeId: string, buttonId: string, updates: Partial<Button>) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  buttons: node.data.buttons.map(btn => 
                    btn.id === buttonId ? { ...btn, ...updates } : btn
                  )
                } 
              }
            : node
        )
      }),
      `Обновлена кнопка`
    );
  }, [updateBotData]);

  const deleteButton = useCallback((nodeId: string, buttonId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const button = node?.data.buttons.find(b => b.id === buttonId);
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  buttons: node.data.buttons.filter(btn => btn.id !== buttonId)
                } 
              }
            : node
        )
      }),
      `Удалена кнопка: ${button?.text || 'unknown'}`
    );
  }, [updateBotData, nodes]);

  const updateNodes = useCallback((newNodes: Node[]) => {
    updateBotData(
      (prevData) => ({
        ...prevData,
        nodes: newNodes
      }),
      `Массовое обновление узлов`
    );
  }, [updateBotData]);

  const setBotData = useCallback((botData: BotData, skipHistory: boolean = false) => {
    console.log('setBotData вызван с данными:', botData);
    console.log('Устанавливаем узлы:', botData.nodes?.length || 0);
    console.log('Устанавливаем связи:', botData.connections?.length || 0);
    
    if (skipHistory) {
      // Прямое обновление без добавления в историю (например, при загрузке шаблона)
      resetHistory();
      pushToHistory(botData, 'Загружены данные бота');
    } else {
      updateBotData(() => botData, 'Установлены данные бота');
    }
    
    setSelectedNodeId(null); // Сбрасываем выбранный узел
    console.log('setBotData завершен');
  }, [updateBotData, resetHistory, pushToHistory]);

  const getBotData = useCallback((): BotData => ({
    nodes,
    connections
  }), [nodes, connections]);

  return {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    updateNodeData,
    addButton,
    updateButton,
    deleteButton,
    updateNodes,
    setBotData,
    getBotData,
    // История изменений
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    undo,
    redo,
    resetHistory
  };
}
