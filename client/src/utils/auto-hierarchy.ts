import { Node, Connection } from '@shared/schema';

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface HierarchyLevel {
  level: number;
  nodes: Node[];
}

export interface LayoutConfig {
  algorithm: 'hierarchical' | 'force' | 'circular' | 'tree' | 'grid' | 'organic';
  levelSpacing: number;
  nodeSpacing: number;
  startX: number;
  startY: number;
  nodeWidth: number;
  nodeHeight: number;
  preventOverlaps: boolean;
  centerAlign: boolean;
  compactLayout: boolean;
  respectNodeTypes: boolean;
  // New viewport-aware properties
  zoom?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  viewportCenterX?: number;
  viewportCenterY?: number;
}

export interface NodeBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface LayoutAnalysis {
  totalNodes: number;
  maxDepth: number;
  avgBranchingFactor: number;
  hasCircularReferences: boolean;
  disconnectedNodes: Node[];
  startNodes: Node[];
  endNodes: Node[];
  recommendedAlgorithm: LayoutConfig['algorithm'];
}

/**
 * Анализирует структуру узлов и рекомендует оптимальный алгоритм компоновки
 */
export function analyzeLayoutStructure(nodes: Node[], connections: Connection[]): LayoutAnalysis {
  const graph = createConnectionGraph(nodes, connections);
  const startNodes = findStartNodes(nodes, graph);
  const endNodes = findEndNodes(nodes, graph);
  const disconnectedNodes = findDisconnectedNodes(nodes, connections);
  
  // Вычисляем глубину графа
  const levels = calculateHierarchyLevels(nodes, graph);
  const maxDepth = levels.length;
  
  // Вычисляем средний коэффициент ветвления
  let totalConnections = 0;
  graph.forEach(targets => {
    totalConnections += targets.size;
  });
  const avgBranchingFactor = totalConnections / Math.max(nodes.length, 1);
  
  // Проверяем на циклические ссылки
  const hasCircularReferences = detectCircularReferences(nodes, graph);
  
  // Рекомендуем алгоритм на основе анализа
  let recommendedAlgorithm: LayoutConfig['algorithm'] = 'hierarchical';
  
  if (disconnectedNodes.length > nodes.length * 0.3) {
    recommendedAlgorithm = 'grid';
  } else if (hasCircularReferences || avgBranchingFactor > 3) {
    recommendedAlgorithm = 'force';
  } else if (nodes.length <= 10 && maxDepth <= 3) {
    recommendedAlgorithm = 'tree';
  } else if (startNodes.length > 1 && endNodes.length > 1) {
    recommendedAlgorithm = 'organic';
  }
  
  return {
    totalNodes: nodes.length,
    maxDepth,
    avgBranchingFactor,
    hasCircularReferences,
    disconnectedNodes,
    startNodes,
    endNodes,
    recommendedAlgorithm
  };
}

/**
 * Универсальная функция автоматической компоновки с выбором алгоритма
 */
export function calculateAutoHierarchy(
  nodes: Node[], 
  connections: Connection[], 
  config?: Partial<LayoutConfig>
): Node[] {
  if (nodes.length === 0) return nodes;

  const analysis = analyzeLayoutStructure(nodes, connections);
  
  const defaultConfig: LayoutConfig = {
    algorithm: analysis.recommendedAlgorithm,
    levelSpacing: 300,
    nodeSpacing: 240, // Увеличен отступ для предотвращения перекрытий
    startX: 100,
    startY: 100,
    nodeWidth: 160, // Стандартный размер узла
    nodeHeight: 100, // Стандартный размер узла
    preventOverlaps: true,
    centerAlign: true,
    compactLayout: false,
    respectNodeTypes: true,
    zoom: 100,
    viewportWidth: 1200,
    viewportHeight: 800,
    viewportCenterX: 600,
    viewportCenterY: 400
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // Adjust spacing based on zoom level
  if (finalConfig.zoom && finalConfig.zoom !== 100) {
    const zoomFactor = finalConfig.zoom / 100;
    finalConfig.levelSpacing = Math.max(200, finalConfig.levelSpacing * zoomFactor);
    finalConfig.nodeSpacing = Math.max(120, finalConfig.nodeSpacing * zoomFactor);
  }
  
  // Adjust layout for viewport size
  if (finalConfig.viewportWidth && finalConfig.viewportHeight) {
    const viewportArea = finalConfig.viewportWidth * finalConfig.viewportHeight;
    const nodeArea = nodes.length * finalConfig.nodeWidth * finalConfig.nodeHeight;
    
    if (nodeArea > viewportArea * 0.6) {
      finalConfig.compactLayout = true;
      finalConfig.levelSpacing = Math.max(180, finalConfig.levelSpacing * 0.8);
      finalConfig.nodeSpacing = Math.max(100, finalConfig.nodeSpacing * 0.8);
    }
    
    // Center the layout in the viewport
    if (finalConfig.centerAlign && finalConfig.viewportCenterX && finalConfig.viewportCenterY) {
      finalConfig.startX = Math.max(50, finalConfig.viewportCenterX - (finalConfig.viewportWidth * 0.4));
      finalConfig.startY = Math.max(50, finalConfig.viewportCenterY - (finalConfig.viewportHeight * 0.4));
    }
  }
  
  switch (finalConfig.algorithm) {
    case 'hierarchical':
      return createHierarchicalLayout(nodes, connections, finalConfig);
    case 'force':
      return createForceDirectedLayout(nodes, connections, finalConfig);
    case 'circular':
      return createCircularLayout(nodes, connections, finalConfig);
    case 'tree':
      return createTreeLayout(nodes, connections, finalConfig);
    case 'grid':
      return createGridLayout(nodes, finalConfig);
    case 'organic':
      return createOrganicLayout(nodes, connections, finalConfig);
    default:
      return createHierarchicalLayout(nodes, connections, finalConfig);
  }
}

/**
 * Генерирует автоматические соединения между узлами на основе их типов и расположения
 */
export function generateAutoConnections(
  nodes: Node[], 
  existingConnections: Connection[]
): Connection[] {
  const newConnections: Connection[] = [];
  const existingConnectionMap = new Map<string, Set<string>>();
  
  // Создаем карту существующих соединений для быстрого поиска
  existingConnections.forEach(conn => {
    if (!existingConnectionMap.has(conn.source)) {
      existingConnectionMap.set(conn.source, new Set());
    }
    existingConnectionMap.get(conn.source)!.add(conn.target);
  });
  
  // Функция для проверки, существует ли уже соединение
  const connectionExists = (source: string, target: string): boolean => {
    return existingConnectionMap.has(source) && existingConnectionMap.get(source)!.has(target);
  };
  
  // Функция для создания соединения
  const createConnection = (source: Node, target: Node, buttonText?: string): Connection => {
    const connectionId = `auto-${source.id}-${target.id}`;
    return {
      id: connectionId,
      source: source.id,
      target: target.id,
      buttonText: buttonText || getDefaultButtonText(source, target),
      sourceHandle: 'right',
      targetHandle: 'left'
    };
  };
  
  // Сортируем узлы по позиции для логичной последовательности
  const sortedNodes = [...nodes].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) < 50) {
      return a.position.x - b.position.x; // Сортировка по X если Y примерно равны
    }
    return a.position.y - b.position.y; // Сортировка по Y
  });
  
  // 1. Соединяем стартовые узлы с первыми логическими узлами
  const startNodes = sortedNodes.filter(node => node.type === 'start');
  const messageNodes = sortedNodes.filter(node => node.type === 'message');
  const commandNodes = sortedNodes.filter(node => node.type === 'command');
  
  startNodes.forEach(startNode => {
    // Находим ближайший узел-сообщение или команду
    const nearestMessage = findNearestNode(startNode, messageNodes);
    const nearestCommand = findNearestNode(startNode, commandNodes);
    
    if (nearestMessage && !connectionExists(startNode.id, nearestMessage.id)) {
      newConnections.push(createConnection(startNode, nearestMessage, 'Начать'));
    }
    
    if (nearestCommand && !connectionExists(startNode.id, nearestCommand.id)) {
      newConnections.push(createConnection(startNode, nearestCommand));
    }
  });
  
  // 2. Создаем логические цепочки сообщений
  messageNodes.forEach((messageNode, index) => {
    const nextMessage = messageNodes[index + 1];
    if (nextMessage && !connectionExists(messageNode.id, nextMessage.id)) {
      // Проверяем, что узлы достаточно близко друг к другу
      const distance = calculateDistance(messageNode.position, nextMessage.position);
      if (distance < 400) { // Максимальное расстояние для автосоединения
        newConnections.push(createConnection(messageNode, nextMessage, 'Далее'));
      }
    }
  });
  
  // 3. Соединяем узлы клавиатуры с сообщениями
  const keyboardNodes = sortedNodes.filter(node => node.type === 'keyboard');
  keyboardNodes.forEach(keyboardNode => {
    const nearbyMessages = messageNodes.filter(msg => {
      const distance = calculateDistance(keyboardNode.position, msg.position);
      return distance < 300 && msg.position.y > keyboardNode.position.y;
    });
    
    nearbyMessages.forEach((messageNode, index) => {
      if (!connectionExists(keyboardNode.id, messageNode.id)) {
        const buttonText = keyboardNode.data?.buttons?.[index]?.text || `Кнопка ${index + 1}`;
        newConnections.push(createConnection(keyboardNode, messageNode, buttonText));
      }
    });
  });
  
  // 4. Соединяем узлы условий с соответствующими ветками
  const conditionNodes = sortedNodes.filter(node => node.type === 'condition');
  conditionNodes.forEach(conditionNode => {
    const nearbyNodes = sortedNodes.filter(node => {
      const distance = calculateDistance(conditionNode.position, node.position);
      return distance < 350 && node.position.y > conditionNode.position.y && node.id !== conditionNode.id;
    });
    
    if (nearbyNodes.length >= 2) {
      // Создаем соединения "Да" и "Нет"
      const leftNode = nearbyNodes.reduce((prev, curr) => 
        prev.position.x < curr.position.x ? prev : curr
      );
      const rightNode = nearbyNodes.reduce((prev, curr) => 
        prev.position.x > curr.position.x ? prev : curr
      );
      
      if (!connectionExists(conditionNode.id, leftNode.id)) {
        newConnections.push(createConnection(conditionNode, leftNode, 'Да'));
      }
      if (!connectionExists(conditionNode.id, rightNode.id)) {
        newConnections.push(createConnection(conditionNode, rightNode, 'Нет'));
      }
    }
  });
  
  // 5. Соединяем узлы ввода с обработчиками
  const inputNodes = sortedNodes.filter(node => node.type === 'input');
  inputNodes.forEach(inputNode => {
    const nearbyProcessors = sortedNodes.filter(node => {
      const distance = calculateDistance(inputNode.position, node.position);
      return distance < 300 && node.position.y > inputNode.position.y && 
             ['message', 'condition'].includes(node.type);
    });
    
    if (nearbyProcessors.length > 0) {
      const closestProcessor = nearbyProcessors[0];
      if (!connectionExists(inputNode.id, closestProcessor.id)) {
        newConnections.push(createConnection(inputNode, closestProcessor, 'Обработать'));
      }
    }
  });
  
  return newConnections;
}

/**
 * Находит ближайший узел из списка к заданному узлу
 */
function findNearestNode(targetNode: Node, nodeList: Node[]): Node | null {
  if (nodeList.length === 0) return null;
  
  return nodeList.reduce((nearest, current) => {
    const nearestDistance = calculateDistance(targetNode.position, nearest.position);
    const currentDistance = calculateDistance(targetNode.position, current.position);
    return currentDistance < nearestDistance ? current : nearest;
  });
}

/**
 * Вычисляет расстояние между двумя точками
 */
function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Генерирует текст кнопки по умолчанию на основе типов узлов
 */
function getDefaultButtonText(source: Node, target: Node): string {
  switch (source.type) {
    case 'start':
      return 'Начать';
    case 'message':
      if (target.type === 'keyboard') return 'Показать меню';
      if (target.type === 'condition') return 'Проверить';
      return 'Далее';
    case 'keyboard':
      return 'Выбрать';
    case 'condition':
      return 'Если да';
    case 'input':
      return 'Ввести';
    case 'command':
      return 'Выполнить';
    default:
      return 'Продолжить';
  }
}

/**
 * Создает иерархическую компоновку (улучшенная версия)
 */
function createHierarchicalLayout(nodes: Node[], connections: Connection[], config: LayoutConfig): Node[] {
  const graph = createConnectionGraph(nodes, connections);
  const levels = calculateHierarchyLevels(nodes, graph);
  return positionNodesByLevel(levels, config);
}

/**
 * Создает граф соединений для анализа иерархии
 */
function createConnectionGraph(nodes: Node[], connections: Connection[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  
  // Инициализируем все узлы
  nodes.forEach(node => {
    graph.set(node.id, new Set());
  });
  
  // Добавляем соединения
  connections.forEach(conn => {
    const targets = graph.get(conn.source);
    if (targets) {
      targets.add(conn.target);
    }
  });
  
  return graph;
}

/**
 * Вычисляет уровни иерархии для узлов
 */
function calculateHierarchyLevels(nodes: Node[], graph: Map<string, Set<string>>): HierarchyLevel[] {
  const visited = new Set<string>();
  const levels = new Map<string, number>();
  
  // Найдем стартовые узлы (узлы типа 'start' или без входящих соединений)
  const startNodes = findStartNodes(nodes, graph);
  
  // Проходим по дереву от стартовых узлов
  startNodes.forEach(startNode => {
    traverseAndSetLevels(startNode.id, 0, graph, levels, visited);
  });
  
  // Обрабатываем изолированные узлы
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  // Группируем узлы по уровням
  const hierarchyLevels: HierarchyLevel[] = [];
  const levelGroups = new Map<number, Node[]>();
  
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });
  
  // Сортируем по уровням
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  
  sortedLevels.forEach(level => {
    hierarchyLevels.push({
      level,
      nodes: levelGroups.get(level) || []
    });
  });
  
  return hierarchyLevels;
}

/**
 * Находит стартовые узлы (типа 'start' или без входящих соединений)
 */
function findStartNodes(nodes: Node[], graph: Map<string, Set<string>>): Node[] {
  // Сначала ищем узлы типа 'start'
  const startTypeNodes = nodes.filter(node => node.type === 'start');
  if (startTypeNodes.length > 0) {
    return startTypeNodes;
  }
  
  // Если нет стартовых узлов, ищем узлы без входящих соединений
  const hasIncoming = new Set<string>();
  graph.forEach(targets => {
    targets.forEach(target => hasIncoming.add(target));
  });
  
  const noIncomingNodes = nodes.filter(node => !hasIncoming.has(node.id));
  return noIncomingNodes.length > 0 ? noIncomingNodes : [nodes[0]];
}

/**
 * Рекурсивно проходит по графу и устанавливает уровни
 */
function traverseAndSetLevels(
  nodeId: string,
  level: number,
  graph: Map<string, Set<string>>,
  levels: Map<string, number>,
  visited: Set<string>
): void {
  if (visited.has(nodeId)) return;
  
  visited.add(nodeId);
  
  // Устанавливаем уровень для текущего узла
  const currentLevel = levels.get(nodeId) || 0;
  levels.set(nodeId, Math.max(currentLevel, level));
  
  // Обрабатываем дочерние узлы
  const targets = graph.get(nodeId);
  if (targets) {
    targets.forEach(targetId => {
      traverseAndSetLevels(targetId, level + 1, graph, levels, visited);
    });
  }
}

/**
 * Расставляет узлы по вычисленным уровням иерархии (улучшенная версия)
 */
function positionNodesByLevel(levels: HierarchyLevel[], config: LayoutConfig): Node[] {
  const positionedNodes: Node[] = [];
  
  levels.forEach((level, levelIndex) => {
    let baseY = config.startY + levelIndex * config.levelSpacing;
    
    // Учитываем тип узлов для адаптивного размещения
    let adjustedNodeSpacing = config.nodeSpacing;
    if (config.respectNodeTypes) {
      const hasWideNodes = level.nodes.some(node => 
        ['keyboard', 'condition', 'input'].includes(node.type)
      );
      if (hasWideNodes) {
        adjustedNodeSpacing = Math.max(config.nodeSpacing, 220);
      }
    }
    
    const totalWidth = (level.nodes.length - 1) * adjustedNodeSpacing;
    let startX = config.centerAlign 
      ? config.startX - totalWidth / 2 
      : config.startX;
    
    // Компактная компоновка для узких экранов
    if (config.compactLayout && level.nodes.length > 4) {
      adjustedNodeSpacing = Math.max(config.nodeSpacing * 0.7, 120);
      const newTotalWidth = (level.nodes.length - 1) * adjustedNodeSpacing;
      startX = config.centerAlign 
        ? config.startX - newTotalWidth / 2 
        : config.startX;
    }
    
    level.nodes.forEach((node, nodeIndex) => {
      let x = startX + nodeIndex * adjustedNodeSpacing;
      let y = baseY;
      
      // Предотвращение перекрытий
      if (config.preventOverlaps) {
        x = Math.max(50, x);
        
        // Проверяем конфликты с уже размещенными узлами
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const tempNode = { ...node, position: { x: x, y: y } };
          const hasOverlap = positionedNodes.some(existing => 
            doNodesOverlap(tempNode, existing, config)
          );
          
          if (!hasOverlap) {
            break; // Позиция найдена
          }
          
          // Сдвигаем узел вправо с учетом минимального отступа
          x += config.nodeWidth + 30;
          attempts++;
        }
        
        // Если все еще есть перекрытие, сдвигаем вниз
        if (attempts >= maxAttempts) {
          x = startX + nodeIndex * adjustedNodeSpacing;
          y = baseY + config.nodeHeight + 30;
        }
      }
      
      positionedNodes.push({
        ...node,
        position: { x: x, y: y }
      });
    });
  });
  
  return positionedNodes;
}

/**
 * Создает force-directed компоновку
 */
function createForceDirectedLayout(nodes: Node[], connections: Connection[], config: LayoutConfig): Node[] {
  const result: Node[] = [];
  const iterations = 100;
  const k = Math.sqrt((800 * 600) / nodes.length); // Константа силы
  
  // Инициализируем случайные позиции
  const positions = new Map<string, LayoutPosition>();
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radius = Math.min(200, nodes.length * 20);
    positions.set(node.id, {
      x: config.startX + Math.cos(angle) * radius,
      y: config.startY + Math.sin(angle) * radius
    });
  });
  
  // Симулируем силы притяжения и отталкивания
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    
    // Инициализируем силы
    nodes.forEach(node => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });
    
    // Силы отталкивания между всеми узлами
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        const pos1 = positions.get(node1.id)!;
        const pos2 = positions.get(node2.id)!;
        
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const repulsion = k * k / distance;
        const fx = (dx / distance) * repulsion;
        const fy = (dy / distance) * repulsion;
        
        const force1 = forces.get(node1.id)!;
        const force2 = forces.get(node2.id)!;
        
        force1.fx += fx;
        force1.fy += fy;
        force2.fx -= fx;
        force2.fy -= fy;
      }
    }
    
    // Силы притяжения для соединенных узлов
    connections.forEach(conn => {
      const pos1 = positions.get(conn.source);
      const pos2 = positions.get(conn.target);
      
      if (pos1 && pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const attraction = distance * distance / k;
        const fx = (dx / distance) * attraction * 0.1;
        const fy = (dy / distance) * attraction * 0.1;
        
        const force1 = forces.get(conn.source)!;
        const force2 = forces.get(conn.target)!;
        
        force1.fx += fx;
        force1.fy += fy;
        force2.fx -= fx;
        force2.fy -= fy;
      }
    });
    
    // Применяем силы
    const temperature = 1 - (iter / iterations);
    nodes.forEach(node => {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;
      
      const displacement = Math.sqrt(force.fx * force.fx + force.fy * force.fy) || 1;
      const maxDisplacement = k * temperature;
      
      pos.x += (force.fx / displacement) * Math.min(displacement, maxDisplacement);
      pos.y += (force.fy / displacement) * Math.min(displacement, maxDisplacement);
      
      // Ограничиваем границы
      pos.x = Math.max(50, Math.min(1500, pos.x));
      pos.y = Math.max(50, Math.min(1000, pos.y));
    });
  }
  
  // Конвертируем в итоговые узлы
  nodes.forEach(node => {
    const pos = positions.get(node.id)!;
    result.push({
      ...node,
      position: pos
    });
  });
  
  return result;
}

/**
 * Создает круговую компоновку
 */
function createCircularLayout(nodes: Node[], connections: Connection[], config: LayoutConfig): Node[] {
  const result: Node[] = [];
  const centerX = config.startX + 400;
  const centerY = config.startY + 300;
  
  // Вычисляем радиус на основе размеров узлов и их количества
  const nodeCircumference = Math.max(config.nodeWidth, config.nodeHeight) + 60; // отступ между узлами
  const totalCircumference = nodes.length * nodeCircumference;
  const radius = Math.max(250, totalCircumference / (2 * Math.PI));
  
  // Сортируем узлы по важности (стартовые узлы в начале)
  const graph = createConnectionGraph(nodes, connections);
  const startNodes = findStartNodes(nodes, graph);
  const sortedNodes = [...startNodes, ...nodes.filter(n => !startNodes.includes(n))];
  
  sortedNodes.forEach((node, index) => {
    const angle = (index / sortedNodes.length) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    result.push({
      ...node,
      position: { x, y }
    });
  });
  
  return result;
}

/**
 * Создает древовидную компоновку
 */
function createTreeLayout(nodes: Node[], connections: Connection[], config: LayoutConfig): Node[] {
  const graph = createConnectionGraph(nodes, connections);
  const startNodes = findStartNodes(nodes, graph);
  
  if (startNodes.length === 0) return nodes;
  
  const result: Node[] = [];
  const positioned = new Set<string>();
  const levels = new Map<string, number>();
  
  // Строим дерево от корневого узла
  const root = startNodes[0];
  buildTreeLevels(root.id, 0, graph, levels, positioned);
  
  // Группируем по уровням
  const levelGroups = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });
  
  // Размещаем узлы
  Array.from(levelGroups.keys()).sort().forEach(level => {
    const levelNodes = levelGroups.get(level)!;
    const y = config.startY + level * config.levelSpacing;
    const totalWidth = (levelNodes.length - 1) * config.nodeSpacing;
    const startX = config.startX - totalWidth / 2;
    
    levelNodes.forEach((node, index) => {
      result.push({
        ...node,
        position: {
          x: startX + index * config.nodeSpacing,
          y
        }
      });
    });
  });
  
  return result;
}

function buildTreeLevels(
  nodeId: string,
  level: number,
  graph: Map<string, Set<string>>,
  levels: Map<string, number>,
  positioned: Set<string>
): void {
  if (positioned.has(nodeId)) return;
  
  positioned.add(nodeId);
  levels.set(nodeId, level);
  
  const targets = graph.get(nodeId);
  if (targets) {
    targets.forEach(targetId => {
      buildTreeLevels(targetId, level + 1, graph, levels, positioned);
    });
  }
}

/**
 * Создает сетчатую компоновку
 */
function createGridLayout(nodes: Node[], config: LayoutConfig): Node[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  
  // Учитываем реальные размеры узлов для расчета расстояния
  const minSpacingX = config.nodeWidth + 40; // минимальный отступ 40px
  const minSpacingY = config.nodeHeight + 40;
  const spacingX = Math.max(minSpacingX, config.nodeSpacing);
  const spacingY = Math.max(minSpacingY, config.levelSpacing * 0.6);
  
  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    return {
      ...node,
      position: {
        x: config.startX + col * spacingX,
        y: config.startY + row * spacingY
      }
    };
  });
}

/**
 * Создает органическую компоновку
 */
function createOrganicLayout(nodes: Node[], connections: Connection[], config: LayoutConfig): Node[] {
  // Комбинирует force-directed с уважением к типам узлов
  let result = createForceDirectedLayout(nodes, connections, config);
  
  // Корректируем позиции на основе типов узлов
  if (config.respectNodeTypes) {
    const graph = createConnectionGraph(nodes, connections);
    const startNodes = findStartNodes(nodes, graph);
    
    // Размещаем стартовые узлы в верхней части
    startNodes.forEach((startNode, index) => {
      const nodeIndex = result.findIndex(n => n.id === startNode.id);
      if (nodeIndex !== -1) {
        result[nodeIndex] = {
          ...result[nodeIndex],
          position: {
            x: config.startX + index * config.nodeSpacing,
            y: config.startY
          }
        };
      }
    });
  }
  
  return result;
}

/**
 * Находит узлы без исходящих соединений (конечные узлы)
 */
function findEndNodes(nodes: Node[], graph: Map<string, Set<string>>): Node[] {
  return nodes.filter(node => {
    const targets = graph.get(node.id);
    return !targets || targets.size === 0;
  });
}

/**
 * Находит изолированные узлы (без входящих и исходящих соединений)
 */
function findDisconnectedNodes(nodes: Node[], connections: Connection[]): Node[] {
  const connectedNodes = new Set<string>();
  
  connections.forEach(conn => {
    connectedNodes.add(conn.source);
    connectedNodes.add(conn.target);
  });
  
  return nodes.filter(node => !connectedNodes.has(node.id));
}

/**
 * Обнаруживает циклические ссылки в графе
 */
function detectCircularReferences(nodes: Node[], graph: Map<string, Set<string>>): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const targets = graph.get(nodeId);
    if (targets) {
      for (const targetId of Array.from(targets)) {
        if (hasCycle(targetId)) return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of nodes) {
    if (hasCycle(node.id)) return true;
  }
  
  return false;
}

/**
 * Вычисляет границы узла
 */
export function calculateNodeBounds(node: Node, config: LayoutConfig): NodeBounds {
  const left = node.position.x;
  const top = node.position.y;
  const width = config.nodeWidth;
  const height = config.nodeHeight;
  
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height
  };
}

/**
 * Проверяет пересечение между двумя узлами с учетом отступов
 */
export function doNodesOverlap(node1: Node, node2: Node, config: LayoutConfig): boolean {
  const bounds1 = calculateNodeBounds(node1, config);
  const bounds2 = calculateNodeBounds(node2, config);
  
  // Увеличиваем отступ между узлами до 40px для предотвращения перекрытий
  const padding = 40;
  
  return !(bounds1.right + padding < bounds2.left || 
           bounds2.right + padding < bounds1.left || 
           bounds1.bottom + padding < bounds2.top || 
           bounds2.bottom + padding < bounds1.top);
}

/**
 * Создает красивое дерево с оптимальными позициями
 */
export function createOptimalTreeLayout(nodes: Node[], connections: Connection[]): Node[] {
  if (nodes.length === 0) return nodes;
  
  // Всегда используем улучшенную сетку с правильными отступами
  return createSimpleGrid(nodes);
}

/**
 * Создает адаптивную компоновку на основе анализа структуры
 */
export function createAdaptiveLayout(nodes: Node[], connections: Connection[]): Node[] {
  const analysis = analyzeLayoutStructure(nodes, connections);
  
  const config: LayoutConfig = {
    algorithm: analysis.recommendedAlgorithm,
    levelSpacing: analysis.maxDepth > 5 ? 250 : 300,
    nodeSpacing: analysis.totalNodes > 10 ? 220 : 240, // Увеличен отступ для предотвращения перекрытий
    startX: 100,
    startY: 100,
    nodeWidth: 160,
    nodeHeight: 100,
    preventOverlaps: true,
    centerAlign: true,
    compactLayout: analysis.totalNodes > 15,
    respectNodeTypes: true
  };
  
  return calculateAutoHierarchy(nodes, connections, config);
}

/**
 * Создает компоновку с улучшенной анимацией
 */
export function animatedAdaptiveLayout(
  nodes: Node[],
  connections: Connection[],
  onNodeUpdate: (nodes: Node[]) => void,
  duration: number = 1000,
  config?: Partial<LayoutConfig>
): void {
  const targetNodes = calculateAutoHierarchy(nodes, connections, config);
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Улучшенная функция сглаживания (ease-out-back)
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    
    const interpolatedNodes = nodes.map((node, index) => {
      const target = targetNodes.find(t => t.id === node.id);
      if (!target) return node;
      
      return {
        ...node,
        position: {
          x: node.position.x + (target.position.x - node.position.x) * easeProgress,
          y: node.position.y + (target.position.y - node.position.y) * easeProgress
        }
      };
    });
    
    onNodeUpdate(interpolatedNodes);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

/**
 * Автоматически расставляет узлы и генерирует соединения между ними
 */
export function calculateAutoHierarchyWithConnections(
  nodes: Node[], 
  connections: Connection[], 
  config?: Partial<LayoutConfig>
): { nodes: Node[]; connections: Connection[] } {
  if (nodes.length === 0) return { nodes, connections };
  
  // Сначала расставляем узлы
  const arrangedNodes = calculateAutoHierarchy(nodes, connections, config);
  
  // Затем генерируем автоматические соединения на основе новых позиций
  const autoConnections = generateAutoConnections(arrangedNodes, connections);
  
  // Объединяем существующие и новые соединения
  const allConnections = [...connections, ...autoConnections];
  
  return {
    nodes: arrangedNodes,
    connections: allConnections
  };
}

/**
 * Анимированная функция для расстановки узлов с автогенерацией соединений
 */
export function animatedAutoHierarchyWithConnections(
  nodes: Node[],
  connections: Connection[],
  onUpdate: (nodes: Node[], connections: Connection[]) => void,
  duration: number = 1000,
  config?: Partial<LayoutConfig>
): void {
  const result = calculateAutoHierarchyWithConnections(nodes, connections, config);
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Функция сглаживания
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    
    const interpolatedNodes = nodes.map((node, index) => {
      const target = result.nodes.find(t => t.id === node.id);
      if (!target) return node;
      
      return {
        ...node,
        position: {
          x: node.position.x + (target.position.x - node.position.x) * easeProgress,
          y: node.position.y + (target.position.y - node.position.y) * easeProgress
        }
      };
    });
    
    // Показываем соединения только в конце анимации
    const currentConnections = progress > 0.8 ? result.connections : connections;
    
    onUpdate(interpolatedNodes, currentConnections);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

/**
 * Создает простую сетку для узлов с правильными отступами и логичной компоновкой
 */
function createSimpleGrid(nodes: Node[]): Node[] {
  if (nodes.length === 0) return nodes;
  
  // Сортируем узлы по типу для логичного расположения
  const sortedNodes = [...nodes].sort((a, b) => {
    const typeOrder = { 'start': 0, 'message': 1, 'keyboard': 2, 'photo': 3, 'condition': 4, 'input': 5, 'command': 6 };
    const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 999;
    const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 999;
    return aOrder - bOrder;
  });
  
  // Адаптивное количество колонок в зависимости от количества элементов
  let cols: number;
  if (nodes.length <= 2) cols = 2;
  else if (nodes.length <= 6) cols = 3;
  else if (nodes.length <= 12) cols = 4;
  else cols = Math.ceil(Math.sqrt(nodes.length));
  
  // Размеры узлов и отступы
  const nodeWidth = 160;
  const nodeHeight = 100;
  const paddingX = 80; // Больший горизонтальный отступ
  const paddingY = 60; // Вертикальный отступ
  
  const spacingX = nodeWidth + paddingX;
  const spacingY = nodeHeight + paddingY;
  const startX = 150; // Больший отступ от края
  const startY = 150;
  
  console.log('createSimpleGrid: nodes count:', nodes.length, 'cols:', cols, 'spacingX:', spacingX, 'spacingY:', spacingY);
  
  return sortedNodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = startX + col * spacingX;
    const y = startY + row * spacingY;
    
    console.log(`Node ${index} (${node.type}): col=${col}, row=${row}, x=${x}, y=${y}`);
    
    return {
      ...node,
      position: {
        x: x,
        y: y
      }
    };
  });
}

/**
 * Анимированная расстановка узлов с плавным переходом
 */
export function animatedHierarchyLayout(
  nodes: Node[],
  connections: Connection[],
  onNodeUpdate: (nodes: Node[]) => void,
  duration: number = 1000
): void {
  const targetNodes = calculateAutoHierarchy(nodes, connections);
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Функция сглаживания (ease-out)
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    const interpolatedNodes = nodes.map((node, index) => {
      const target = targetNodes[index];
      if (!target) return node;
      
      return {
        ...node,
        position: {
          x: node.position.x + (target.position.x - node.position.x) * easeProgress,
          y: node.position.y + (target.position.y - node.position.y) * easeProgress
        }
      };
    });
    
    onNodeUpdate(interpolatedNodes);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}