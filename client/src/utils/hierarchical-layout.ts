import { Node, Connection } from '@/types/bot';
import { getIsMobile } from '@/hooks/use-mobile';

interface LayoutNode extends Node {
  level?: number;
  children?: LayoutNode[];
  visited?: boolean;
}

interface HierarchicalLayoutOptions {
  levelHeight: number;
  nodeWidth: number;
  nodeHeight: number; // Добавлена высота узла
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
  nodeSizes?: Map<string, { width: number; height: number }>; // Карта реальных размеров узлов
}

const DEFAULT_OPTIONS: HierarchicalLayoutOptions = {
  levelHeight: 100,
  nodeWidth: 320,
  nodeHeight: 120,
  horizontalSpacing: 80,
  verticalSpacing: 60,
  startX: 50,
  startY: 50
};

/**
 * Получает размер узла с учетом реальных измерений или дефолтных значений
 */
function getNodeSize(nodeId: string, options: HierarchicalLayoutOptions): { width: number; height: number } {
  const realSize = options.nodeSizes?.get(nodeId);
  return realSize || { width: options.nodeWidth, height: options.nodeHeight };
}

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
  console.log('🔄 Hierarchical layout called with', nodes.length, 'nodes, nodeSizes:', !!options.nodeSizes);
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
 * Исправляет коллизии узлов на одном уровне
 */
function fixCollisions(nodes: Node[], options: HierarchicalLayoutOptions): Node[] {
  // Группируем узлы по уровням (приблизительно по X координатам)
  const levelGroups = new Map<number, Node[]>();
  const levelWidth = options.nodeWidth + options.horizontalSpacing;
  
  nodes.forEach(node => {
    // Округляем X координату до ближайшего уровня
    const level = Math.round((node.position.x - options.startX) / levelWidth);
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });
  
  // Для каждого уровня проверяем коллизии и корректируем позиции
  levelGroups.forEach((levelNodes) => {
    // Сортируем узлы по Y координате
    levelNodes.sort((a, b) => a.position.y - b.position.y);
    
    // Проверяем и исправляем перекрытия
    for (let i = 1; i < levelNodes.length; i++) {
      const currentNode = levelNodes[i];
      const prevNode = levelNodes[i - 1];
      
      const currentSize = getNodeSize(currentNode.id, options);
      const prevSize = getNodeSize(prevNode.id, options);
      
      const prevBottom = prevNode.position.y + prevSize.height;
      const currentTop = currentNode.position.y;
      
      // Если есть перекрытие или недостаточное расстояние
      const minSpacing = options.verticalSpacing;
      if (currentTop < prevBottom + minSpacing) {
        // Сдвигаем текущий узел вниз
        currentNode.position.y = prevBottom + minSpacing;
      }
    }
  });
  
  return nodes;
}

/**
 * Располагает узлы в правильной вертикальной древовидной иерархии
 * С горизонтальным размещением цепочек автопереходов
 */
function arrangeNodesByLevel(levels: LayoutNode[][], options: HierarchicalLayoutOptions): Node[] {
  const result: Node[] = [];
  
  // Создаем карту узлов для быстрого доступа
  const nodeMap = new Map<string, LayoutNode>();
  levels.flat().forEach(node => nodeMap.set(node.id, node));
  
  // Находим цепочки автопереходов
  function findAutoTransitionChains(nodes: LayoutNode[]): Set<string>[] {
    const chains: Set<string>[] = [];
    const visited = new Set<string>();
    
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      // Проверяем, есть ли у узла автопереход
      if ((node as any).data?.autoTransitionTo) {
        const chain = new Set<string>();
        let currentNode: LayoutNode | undefined = node;
        
        // Идем по цепочке автопереходов
        while (currentNode && !visited.has(currentNode.id)) {
          chain.add(currentNode.id);
          visited.add(currentNode.id);
          
          const nextNodeId = (currentNode as any).data?.autoTransitionTo;
          if (nextNodeId) {
            currentNode = nodeMap.get(nextNodeId);
          } else {
            break;
          }
        }
        
        if (chain.size > 1) {
          chains.push(chain);
        }
      }
    });
    
    return chains;
  }
  
  const autoTransitionChains = findAutoTransitionChains(levels.flat());
  
  // Проверяем, является ли узел частью цепочки автопереходов
  function isInAutoChain(nodeId: string): boolean {
    return autoTransitionChains.some(chain => chain.has(nodeId));
  }
  
  // Назначаем y позиции с учетом размеров поддеревьев
  function assignYPositions(node: LayoutNode, startY: number, visited = new Set<string>()): number {
    // Проверяем на циклы - если узел уже посещен, возвращаем текущую позицию
    if (visited.has(node.id)) {
      return startY;
    }
    
    visited.add(node.id);
    const nodeSize = getNodeSize(node.id, options);
    
    if (!node.children || node.children.length === 0) {
      // Листовой узел - присваиваем текущую позицию
      (node as any)._y = startY;
      visited.delete(node.id); // Убираем из visited после обработки
      return startY + nodeSize.height + options.verticalSpacing;
    }
    
    // Сначала назначаем позиции детям
    let childY = startY;
    const childCenters: number[] = [];
    
    for (const child of node.children) {
      // Передаем копию visited сета для каждого дочернего узла
      const childVisited = new Set(visited);
      childY = assignYPositions(child, childY, childVisited);
      const childSize = getNodeSize(child.id, options);
      const childCenterY = (child as any)._y + childSize.height / 2;
      childCenters.push(childCenterY);
    }
    
    // Центрируем родительский узел относительно центров дочерних узлов
    if (childCenters.length > 0) {
      const avgChildCenterY = childCenters.reduce((sum, y) => sum + y, 0) / childCenters.length;
      const parentSize = getNodeSize(node.id, options);
      (node as any)._y = avgChildCenterY - parentSize.height / 2;
    } else {
      // Если нет дочерних узлов, используем стартовую позицию
      (node as any)._y = startY;
    }
    
    visited.delete(node.id); // Убираем из visited после обработки
    return childY;
  }
  
  // Находим корневые узлы (уровень 0)
  const rootNodes = levels[0] || [];
  let currentY = options.startY;
  
  // Назначаем позиции для каждого корневого узла
  rootNodes.forEach(rootNode => {
    currentY = assignYPositions(rootNode, currentY);
    currentY += options.verticalSpacing; // Полный отступ между корневыми деревьями
  });
  
  // Создаем результат с правильными позициями
  // Сначала обрабатываем узлы в цепочках автопереходов отдельно
  const processedNodes = new Set<string>();
  
  // Обрабатываем цепочки автопереходов
  autoTransitionChains.forEach(chain => {
    const chainArray = Array.from(chain);
    
    // Находим ВСЕ узлы цепочки в levels и определяем минимальный уровень
    let minLevel = Infinity;
    let chainY = options.startY;
    
    // Сначала находим правильную Y координату
    for (const nodeId of chainArray) {
      for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
        const found = levels[levelIndex].find(n => n.id === nodeId);
        if (found) {
          if (levelIndex < minLevel) {
            minLevel = levelIndex;
          }
          // Берем Y координату из узла, если она определена
          if ((found as any)._y !== undefined) {
            chainY = (found as any)._y;
          }
          break;
        }
      }
    }
    
    if (minLevel === Infinity) return;
    
    // Вычисляем базовую X позицию для минимального уровня
    let baseX = options.startX;
    for (let i = 0; i < minLevel; i++) {
      const prevLevel = levels[i] || [];
      const prevLevelMaxWidth = prevLevel.length > 0 
        ? Math.max(...prevLevel.map(n => getNodeSize(n.id, options).width))
        : 0;
      baseX += prevLevelMaxWidth + options.horizontalSpacing;
    }
    
    // Размещаем все узлы цепочки горизонтально
    let currentX = baseX;
    chainArray.forEach((nodeId) => {
      const node = levels.flat().find(n => n.id === nodeId);
      if (!node) return;
      
      const nodeSize = getNodeSize(nodeId, options);
      
      // Убираем циклические свойства перед добавлением в результат
      const { children, visited, level, ...cleanNode } = node;
      result.push({
        ...cleanNode,
        position: { x: currentX, y: chainY }
      });
      
      processedNodes.add(nodeId);
      currentX += nodeSize.width + options.horizontalSpacing;
    });
  });
  
  // Обрабатываем остальные узлы (не в цепочках автопереходов)
  levels.forEach((levelNodes, levelIndex) => {
    // Вычисляем X позицию с учетом максимальной ширины узлов на предыдущих уровнях
    let baseX = options.startX;
    for (let i = 0; i < levelIndex; i++) {
      const prevLevel = levels[i] || [];
      const prevLevelMaxWidth = prevLevel.length > 0 
        ? Math.max(...prevLevel.map(n => getNodeSize(n.id, options).width))
        : 0;
      baseX += prevLevelMaxWidth + options.horizontalSpacing;
    }
    
    levelNodes.forEach((node) => {
      // Пропускаем узлы, которые уже обработаны в цепочках
      if (processedNodes.has(node.id)) return;
      
      const y = (node as any)._y || (options.startY + result.length * options.verticalSpacing);
      
      // Убираем циклические свойства перед добавлением в результат
      const { children, visited, level, ...cleanNode } = node;
      result.push({
        ...cleanNode,
        position: { x: baseX, y }
      });
    });
  });
  
  // Проверка коллизий на одном уровне и корректировка позиций
  const resultWithCollisionFix = fixCollisions(result, options);
  
  return resultWithCollisionFix;
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
export function applyTemplateLayout(
  nodes: Node[], 
  connections: Connection[], 
  templateName?: string, 
  nodeSizes?: Map<string, { width: number; height: number }>
): Node[] {
  console.log('🎯 ApplyTemplateLayout called:', templateName, 'nodes:', nodes.length, 'nodeSizes:', !!nodeSizes);
  
  // Проверяем, это шаблон VProgulke
  if (templateName?.toLowerCase().includes('vprogulke') || templateName?.toLowerCase().includes('знакомства')) {
    console.log('🌟 Using VProgulke layout');
    return createVProgulkeHierarchicalLayout(nodes, connections);
  }
  
  // Определяем, мобильное ли это устройство
  const isMobile = getIsMobile();
  
  // Для остальных шаблонов используем стандартную иерархическую компоновку
  console.log(isMobile ? '📱 Using mobile-optimized hierarchical layout' : '📏 Using desktop hierarchical layout with real sizes');
  
  // Параметры для мобильных устройств - более компактные
  const mobileOptions = {
    levelHeight: 120,
    nodeWidth: 280,
    nodeHeight: 100,
    horizontalSpacing: 60, // Значительно уменьшено для мобильных экранов
    verticalSpacing: 50, // Значительно уменьшено для мобильных экранов
    startX: 50,
    startY: 50,
    nodeSizes
  };
  
  // Параметры для десктопных устройств
  const desktopOptions = {
    levelHeight: 150,
    nodeWidth: 320,
    nodeHeight: 120,
    horizontalSpacing: 100,
    verticalSpacing: 80,
    startX: 100,
    startY: 100,
    nodeSizes
  };
  
  return createHierarchicalLayout(nodes, connections, isMobile ? mobileOptions : desktopOptions);
}