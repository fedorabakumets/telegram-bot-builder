import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Button, BotData } from '@shared/schema';
import { applyTemplateLayout } from '@/utils/hierarchical-layout';
import { generateNewId } from './utils/extract-base-id';

/**
 * Интерфейс для состояния истории изменений
 */
interface HistoryState {
  /** Массив узлов в определенный момент времени */
  nodes: Node[];
}

/**
 * Хук для управления редактором бота
 * 
 * Предоставляет полный набор функций для работы с узлами и соединениями бота,
 * включая создание, редактирование, удаление, копирование и управление историей изменений.
 * 
 * @param initialData - Начальные данные бота (узлы и соединения)
 * @returns Объект с состоянием и методами для управления редактором
 */
export function useBotEditor(initialData?: BotData) {
  /** Массив всех узлов в редакторе */
  const [nodes, setNodes] = useState<Node[]>(initialData?.nodes || []);
  /** ID выбранного в данный момент узла */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  /** Флаг, указывающий на то, что узел в данный момент перетаскивается */
  const [isNodeBeingDragged, setIsNodeBeingDragged] = useState(false);

  /** История состояний для функций отмены/повтора */
  const [history, setHistory] = useState<HistoryState[]>([]);
  /** Текущий индекс в истории состояний */
  const [historyIndex, setHistoryIndex] = useState(-1);
  /** Флаг для предотвращения сохранения в историю при операциях undo/redo */
  const isRedoUndoActionRef = useRef(false);

  /** Объект выбранного узла или null, если ничего не выбрано */
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  /**
   * Сохраняет текущее состояние узлов в историю
   * Используется для реализации функций отмены и повтора действий
   */
  const saveToHistory = useCallback(() => {
    if (isRedoUndoActionRef.current) {
      return;
    }

    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes))
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      return newHistory.slice(-50);
    });

    setHistoryIndex(prev => prev + 1);
  }, [nodes, historyIndex]);

  /**
   * Отменяет последнее действие, возвращая состояние к предыдущему в истории
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];

      isRedoUndoActionRef.current = true;
      setHistoryIndex(prevIndex);
      setSelectedNodeId(null);
      setNodes(prevState.nodes);
      
      setTimeout(() => {
        isRedoUndoActionRef.current = false;
      }, 100);
    }
  }, [history, historyIndex]);

  /**
   * Повторяет отмененное действие, переходя к следующему состоянию в истории
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];

      isRedoUndoActionRef.current = true;
      setHistoryIndex(nextIndex);
      setSelectedNodeId(null);
      setNodes(nextState.nodes);
      
      setTimeout(() => {
        isRedoUndoActionRef.current = false;
      }, 100);
    }
  }, [history, historyIndex]);

  /** Проверяет, доступна ли операция отмены */
  const canUndo = historyIndex > 0;
  /** Проверяет, доступна ли операция повтора */
  const canRedo = historyIndex < history.length - 1;

  /**
   * Инициализирует историю при первой загрузке данных
   */
  useEffect(() => {
    if (history.length === 0 && nodes.length > 0) {
      const initialState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes))
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [nodes, history.length]);

  /**
   * Автоматически сохраняет состояние в историю при изменении узлов
   * Использует дебаунс для предотвращения частых сохранений
   * ОТКЛЮЧЕНО: сохранения теперь вызываются вручную для критичных изменений
   */
  useEffect(() => {
    // Автосохранение отключено для предотвращения дублирования
    // saveToHistory вызывается вручную в editor.tsx для важных изменений
    return () => {};
  }, []);


  /**
   * Добавляет новый узел в редактор
   * @param node - Узел для добавления
   */
  const addNode = useCallback((node: Node) => {
    setNodes(prev => [...prev, node]);
  }, []);

  /**
   * Обновляет существующий узел
   * @param nodeId - ID узла для обновления
   * @param updates - Частичные данные для обновления
   */
  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  /**
   * Удаляет узел и все связанные с ним соединения
   * @param nodeId - ID узла для удаления
   */
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  /**
   * Обновляет данные узла
   * @param nodeId - ID узла
   * @param data - Частичные данные узла для обновления
   */
  const updateNodeData = useCallback((nodeId: string, data: Partial<Node['data']>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  }, []);

  /**
   * Добавляет кнопку к узлу
   * @param nodeId - ID узла
   * @param button - Кнопка для добавления
   */
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

  /**
   * Обновляет существующую кнопку узла
   * @param nodeId - ID узла
   * @param buttonId - ID кнопки
   * @param updates - Частичные данные кнопки для обновления
   */
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

  /**
   * Удаляет кнопку из узла
   * @param nodeId - ID узла
   * @param buttonId - ID кнопки для удаления
   */
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

  /**
   * Обновляет весь массив узлов
   * @param newNodes - Новый массив узлов
   */
  const updateNodes = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  /**
   * Нормализует данные узла, применяя значения по умолчанию
   * Клиентская версия серверной нормализации данных
   * @param node - Узел для нормализации
   * @returns Нормализованный узел
   */
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

  /**
   * Устанавливает данные бота (узлы и соединения) с возможностью применения шаблона компоновки
   * @param botData - Данные бота для установки
   * @param templateName - Название шаблона компоновки (опционально)
   * @param nodeSizes - Карта размеров узлов (опционально)
   * @param skipLayout - Флаг для отключения автоматической компоновки (опционально)
   */
  const setBotData = useCallback((
    botData: BotData,
    templateName?: string,
    nodeSizes?: Map<string, { width: number; height: number }>,
    skipLayout?: boolean // Новый параметр для отключения автоматического layout
  ) => {
    // Устанавливаем данные бота

    // Нормализуем узлы перед применением компоновки
    const normalizedNodes = (botData.nodes || []).map(normalizeNodeData);

    // Применяем иерархическую компоновку только если не отключена
    const finalNodes = skipLayout
      ? normalizedNodes
      : applyTemplateLayout(normalizedNodes, [], templateName, nodeSizes);

    setNodes(finalNodes);
    setSelectedNodeId(null); // Сбрасываем выбранный узел

    // setBotData завершен
  }, [normalizeNodeData]);

  /**
   * Создает копию узла с новым ID и смещенной позицией
   * @param nodeId - ID узла для дублирования
   */
  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(node => node.id === nodeId);
    if (!nodeToDuplicate) return;

    // Создаем копию узла с новым ID и смещенной позицией
    const duplicatedNode: Node = {
      ...JSON.parse(JSON.stringify(nodeToDuplicate)), // Глубокое копирование
      id: generateNewId(nodeId, 'copy'), // Новый уникальный ID
      position: {
        x: nodeToDuplicate.position.x + 50, // Смещение вправо
        y: nodeToDuplicate.position.y + 50  // Смещение вниз
      }
    };

    setNodes(prev => [...prev, duplicatedNode]);
    setSelectedNodeId(duplicatedNode.id); // Выбираем скопированный узел
  }, [nodes]);

  /**
   * Создает копии нескольких узлов со всеми связями между ними
   * @param nodeIds - Массив ID узлов для дублирования
   */
  const duplicateNodes = useCallback((nodeIds: string[]) => {
    const nodesToDuplicate = nodes.filter(node => nodeIds.includes(node.id));
    if (nodesToDuplicate.length === 0) return;

    const idMapping: { [oldId: string]: string } = {};
    const duplicatedNodes: Node[] = [];

    // Создаем копии узлов с новыми ID
    nodesToDuplicate.forEach(node => {
      const newId = generateNewId(node.id, 'copy');
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

    setNodes(prev => [...prev, ...duplicatedNodes]);

    // Выбираем первый скопированный узел
    if (duplicatedNodes.length > 0) {
      setSelectedNodeId(duplicatedNodes[0].id);
    }
  }, [nodes]);

  /**
   * Возвращает текущие данные бота (узлы)
   * @returns Объект с текущими узлами
   */
  const getBotData = useCallback((): BotData => ({
    nodes
  }), [nodes]);

  /**
   * Копирует выбранные узлы в буфер обмена для межпроектного использования
   * @param nodeIds - Массив ID узлов для копирования
   * @returns Объект с скопированными данными
   */
  const copyToClipboard = useCallback((nodeIds: string[]) => {
    const nodesToCopy = nodes.filter(node => nodeIds.includes(node.id));

    const clipboardData = {
      nodes: nodesToCopy,
      timestamp: Date.now(),
      projectType: 'telegram-bot'
    };

    // Сохраняем в localStorage для межпроектного буфера обмена
    localStorage.setItem('bot-clipboard', JSON.stringify(clipboardData));

    return clipboardData;
  }, [nodes]);

  /**
   * Вставляет элементы из буфера обмена в заданную позицию
   * @param targetX - Целевая позиция X на холсте (по умолчанию 100)
   * @param targetY - Целевая позиция Y на холсте (по умолчанию 100)
   * @returns true если вставка прошла успешно, false в противном случае
   */
  const pasteFromClipboard = useCallback((targetX: number = 100, targetY: number = 100) => {
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

      // Находим bounding box оригинальных узлов
      const minX = Math.min(...clipboardData.nodes.map((n: Node) => n.position.x));
      const minY = Math.min(...clipboardData.nodes.map((n: Node) => n.position.y));

      // Вычисляем центр bounding box для центрирования в точке клика
      const maxX = Math.max(...clipboardData.nodes.map((n: Node) => n.position.x));
      const maxY = Math.max(...clipboardData.nodes.map((n: Node) => n.position.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Создаем новые ID для всех узлов
      clipboardData.nodes.forEach((node: Node) => {
        const newId = generateNewId(node.id, 'paste');
        idMapping[node.id] = newId;

        // Вычисляем смещение узла относительно центра
        const offsetX = node.position.x - centerX;
        const offsetY = node.position.y - centerY;

        const pastedNode: Node = {
          ...JSON.parse(JSON.stringify(node)),
          id: newId,
          position: {
            x: targetX + offsetX,
            y: targetY + offsetY
          }
        };

        pastedNodes.push(pastedNode);
      });

      // Добавляем элементы на холст
      setNodes(prev => [...prev, ...pastedNodes]);

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

  /**
   * Проверяет наличие валидных данных в буфере обмена
   * @returns true если в буфере есть валидные данные, false в противном случае
   */
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
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    duplicateNodes,
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
    setIsNodeBeingDragged,
    saveToHistory
  };
}
