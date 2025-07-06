import { useState, useCallback } from 'react';
import { Node, Connection, Button, BotData } from '@/types/bot';

export function useBotEditor(initialData?: BotData) {
  const [nodes, setNodes] = useState<Node[]>(initialData?.nodes || []);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

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
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
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
              buttons: [...node.data.buttons, button] 
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
              buttons: node.data.buttons.map(btn => 
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
              buttons: node.data.buttons.filter(btn => btn.id !== buttonId)
            } 
          }
        : node
    ));
  }, []);

  const updateNodes = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  const setBotData = useCallback((botData: BotData) => {
    console.log('setBotData вызван с данными:', botData);
    console.log('Устанавливаем узлы:', botData.nodes?.length || 0);
    console.log('Устанавливаем связи:', botData.connections?.length || 0);
    
    setNodes(botData.nodes || []);
    setConnections(botData.connections || []);
    setSelectedNodeId(null); // Сбрасываем выбранный узел
    
    console.log('setBotData завершен');
  }, []);

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
    getBotData
  };
}
