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
    nodeSpacing: 180,
    startX: 100,
    startY: 100,
    nodeWidth: 160,
    nodeHeight: 100,
    preventOverlaps: true,
    centerAlign: true,
    compactLayout: false,
    respectNodeTypes: true
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
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
    const y = config.startY + levelIndex * config.levelSpacing;
    
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
      
      // Предотвращение перекрытий
      if (config.preventOverlaps) {
        x = Math.max(50, x);
        
        // Проверяем конфликты с уже размещенными узлами
        const existingNode = positionedNodes.find(existing => 
          Math.abs(existing.position.x - x) < config.nodeWidth * 0.8 &&
          Math.abs(existing.position.y - y) < config.nodeHeight * 0.8
        );
        
        if (existingNode) {
          x = existingNode.position.x + config.nodeWidth + 20;
        }
      }
      
      positionedNodes.push({
        ...node,
        position: { x, y }
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
  const radius = Math.max(200, nodes.length * 15);
  
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
  
  const spacing = config.compactLayout ? 150 : config.nodeSpacing;
  
  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    return {
      ...node,
      position: {
        x: config.startX + col * spacing,
        y: config.startY + row * spacing
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
      for (const targetId of targets) {
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
 * Проверяет пересечение между двумя узлами
 */
export function doNodesOverlap(node1: Node, node2: Node, config: LayoutConfig): boolean {
  const bounds1 = calculateNodeBounds(node1, config);
  const bounds2 = calculateNodeBounds(node2, config);
  
  return !(bounds1.right < bounds2.left || 
           bounds2.right < bounds1.left || 
           bounds1.bottom < bounds2.top || 
           bounds2.bottom < bounds1.top);
}

/**
 * Создает красивое дерево с оптимальными позициями
 */
export function createOptimalTreeLayout(nodes: Node[], connections: Connection[]): Node[] {
  if (nodes.length === 0) return nodes;
  
  // Для небольшого количества узлов используем простую сетку
  if (nodes.length <= 4) {
    return createSimpleGrid(nodes);
  }
  
  // Для большего количества используем иерархический алгоритм
  return calculateAutoHierarchy(nodes, connections);
}

/**
 * Создает адаптивную компоновку на основе анализа структуры
 */
export function createAdaptiveLayout(nodes: Node[], connections: Connection[]): Node[] {
  const analysis = analyzeLayoutStructure(nodes, connections);
  
  const config: LayoutConfig = {
    algorithm: analysis.recommendedAlgorithm,
    levelSpacing: analysis.maxDepth > 5 ? 250 : 300,
    nodeSpacing: analysis.totalNodes > 10 ? 160 : 180,
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
 * Создает простую сетку для небольшого количества узлов
 */
function createSimpleGrid(nodes: Node[]): Node[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 200;
  const startX = 100;
  const startY = 100;
  
  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    return {
      ...node,
      position: {
        x: startX + col * spacing,
        y: startY + row * spacing
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