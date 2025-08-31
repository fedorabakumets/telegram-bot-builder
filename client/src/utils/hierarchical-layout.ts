import { Node, Connection } from '@/types/bot';

interface LayoutNode extends Node {
  level?: number;
  children?: LayoutNode[];
  visited?: boolean;
}

interface HierarchicalLayoutOptions {
  levelHeight: number;
  nodeWidth: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
}

const DEFAULT_OPTIONS: HierarchicalLayoutOptions = {
  levelHeight: 200,
  nodeWidth: 320,
  horizontalSpacing: 100,
  verticalSpacing: 200,
  startX: 50,
  startY: 50
};

/**
 * Создает иерархическое расположение узлов на основе соединений
 * @param nodes - массив узлов для расположения
 * @param connections - массив соединений между узлами
 * @param options - опции компоновки
 * @returns обновленные узлы с новыми позициями
 */
export function createHierarchicalLayout(
  nodes: Node[], 
  connections: Connection[], 
  options: Partial<HierarchicalLayoutOptions> = {}
): Node[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (nodes.length === 0) return nodes;

  // Создаем копию узлов для обработки
  const layoutNodes: LayoutNode[] = nodes.map(node => ({ 
    ...node, 
    level: 0, 
    children: [], 
    visited: false 
  }));

  // Находим стартовый узел (обычно с типом 'start' или без входящих соединений)
  const startNode = findStartNode(layoutNodes, connections);
  if (!startNode) {
    // Если стартовый узел не найден, берем первый
    return arrangeNodesLinear(layoutNodes, opts);
  }

  // Строим дерево зависимостей
  buildDependencyTree(layoutNodes, connections, startNode);
  
  // Вычисляем уровни для каждого узла
  assignLevels(startNode);

  // Группируем узлы по уровням
  const levels = groupNodesByLevel(layoutNodes);
  
  // Располагаем узлы по уровням
  return arrangeNodesByLevel(levels, opts);
}

/**
 * Находит стартовый узел (узел типа 'start' или узел без входящих соединений)
 */
function findStartNode(nodes: LayoutNode[], connections: Connection[]): LayoutNode | null {
  // Сначала ищем узел типа 'start'
  const startNode = nodes.find(node => node.type === 'start');
  if (startNode) return startNode;

  // Если нет узла 'start', ищем узел без входящих соединений
  const nodeIds = nodes.map(n => n.id);
  const targetIds = new Set(connections.map(c => c.target));
  
  const rootNodes = nodes.filter(node => !targetIds.has(node.id));
  return rootNodes.length > 0 ? rootNodes[0] : nodes[0];
}

/**
 * Строит дерево зависимостей на основе соединений
 */
function buildDependencyTree(nodes: LayoutNode[], connections: Connection[], startNode: LayoutNode) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  // Создаем граф соединений
  const graph = new Map<string, string[]>();
  connections.forEach(connection => {
    if (!graph.has(connection.source)) {
      graph.set(connection.source, []);
    }
    graph.get(connection.source)!.push(connection.target);
  });

  // Рекурсивно строим дерево
  function buildTree(node: LayoutNode, visited = new Set<string>()) {
    if (visited.has(node.id)) return; // Избегаем циклов
    visited.add(node.id);
    
    const children = graph.get(node.id) || [];
    node.children = children
      .map(childId => nodeMap.get(childId))
      .filter(Boolean) as LayoutNode[];
    
    node.children.forEach(child => buildTree(child, visited));
  }

  buildTree(startNode);
}

/**
 * Присваивает уровни узлам в дереве
 */
function assignLevels(startNode: LayoutNode, level = 0) {
  startNode.level = level;
  startNode.visited = true;
  
  if (startNode.children) {
    startNode.children.forEach(child => {
      if (!child.visited) {
        assignLevels(child, level + 1);
      }
    });
  }
}

/**
 * Группирует узлы по уровням
 */
function groupNodesByLevel(nodes: LayoutNode[]): LayoutNode[][] {
  const levels: LayoutNode[][] = [];
  
  nodes.forEach(node => {
    const level = node.level || 0;
    if (!levels[level]) {
      levels[level] = [];
    }
    levels[level].push(node);
  });
  
  return levels;
}

/**
 * Располагает узлы по уровням с равномерным распределением
 */
function arrangeNodesByLevel(levels: LayoutNode[][], options: HierarchicalLayoutOptions): Node[] {
  const result: Node[] = [];
  
  levels.forEach((levelNodes, levelIndex) => {
    const y = options.startY + levelIndex * options.verticalSpacing;
    
    // Вычисляем общую ширину уровня
    const totalWidth = levelNodes.length * options.nodeWidth + (levelNodes.length - 1) * options.horizontalSpacing;
    const startX = options.startX + Math.max(0, (1200 - totalWidth) / 2); // Центрируем по ширине 1200px
    
    levelNodes.forEach((node, nodeIndex) => {
      const x = startX + nodeIndex * (options.nodeWidth + options.horizontalSpacing);
      
      // Убираем циклические свойства перед добавлением в результат
      const { children, visited, level, ...cleanNode } = node;
      result.push({
        ...cleanNode,
        position: { x, y }
      });
    });
  });
  
  return result;
}

/**
 * Линейное расположение узлов (fallback)
 */
function arrangeNodesLinear(nodes: LayoutNode[], options: HierarchicalLayoutOptions): Node[] {
  return nodes.map((node, index) => {
    // Убираем циклические свойства перед возвратом
    const { children, visited, level, ...cleanNode } = node;
    return {
      ...cleanNode,
      position: {
        x: options.startX + (index % 3) * (options.nodeWidth + options.horizontalSpacing),
        y: options.startY + Math.floor(index / 3) * options.verticalSpacing
      }
    };
  });
}

/**
 * Функция для специального расположения шаблона VProgulke
 */
export function createVProgulkeHierarchicalLayout(nodes: Node[], connections: Connection[]): Node[] {
  // Определяем последовательность узлов для VProgulke бота
  const nodeSequence = [
    'start',
    'join_request', 
    'decline_response',
    'gender_selection',
    'name_input',
    'age_input', 
    'metro_selection',
    'interests_categories',
    'hobby_interests',
    'relationship_status',
    'sexual_orientation',
    'telegram_channel_ask',
    'telegram_channel_input',
    'additional_info',
    'profile_complete',
    'chat_link',
    'show_profile'
  ];

  // Создаем карту узлов для быстрого доступа
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  // Специальные позиции для узлов VProgulke
  const specialPositions: Record<string, {x: number, y: number}> = {
    // Уровень 1: Старт
    'start': { x: 100, y: 50 },
    
    // Уровень 2: Выбор участия
    'join_request': { x: 100, y: 250 },
    'decline_response': { x: 450, y: 250 },
    
    // Уровень 3: Основные данные
    'gender_selection': { x: 100, y: 450 },
    'name_input': { x: 450, y: 450 },
    'age_input': { x: 800, y: 450 },
    
    // Уровень 4: Локация и интересы
    'metro_selection': { x: 100, y: 650 },
    'interests_categories': { x: 450, y: 650 },
    'hobby_interests': { x: 800, y: 650 },
    
    // Уровень 5: Дополнительная информация
    'relationship_status': { x: 100, y: 850 },
    'sexual_orientation': { x: 450, y: 850 },
    'telegram_channel_ask': { x: 800, y: 850 },
    
    // Уровень 6: Дополнительные данные
    'telegram_channel_input': { x: 100, y: 1050 },
    'additional_info': { x: 450, y: 1050 },
    
    // Уровень 7: Завершение
    'profile_complete': { x: 100, y: 1250 },
    'chat_link': { x: 450, y: 1250 },
    'show_profile': { x: 800, y: 1250 }
  };

  // Применяем позиции к узлам
  const layoutNodes = nodes.map(node => {
    const position = specialPositions[node.id] || { 
      x: Math.random() * 800 + 100, 
      y: Math.random() * 600 + 100 
    };
    
    return {
      ...node,
      position
    };
  });

  return layoutNodes;
}

/**
 * Автоматически определяет тип шаблона и применяет соответствующую компоновку
 */
export function applyTemplateLayout(nodes: Node[], connections: Connection[], templateName?: string): Node[] {
  // Проверяем, это шаблон VProgulke
  if (templateName?.toLowerCase().includes('vprogulke') || templateName?.toLowerCase().includes('знакомства')) {
    return createVProgulkeHierarchicalLayout(nodes, connections);
  }
  
  // Для остальных шаблонов используем стандартную иерархическую компоновку
  return createHierarchicalLayout(nodes, connections, {
    levelHeight: 180,
    nodeWidth: 320,
    horizontalSpacing: 80,
    verticalSpacing: 200,
    startX: 100,
    startY: 100
  });
}