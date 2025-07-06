import { Node, Connection } from '@shared/schema';

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface HierarchyLevel {
  level: number;
  nodes: Node[];
}

/**
 * Автоматическая расстановка узлов в иерархическом порядке
 */
export function calculateAutoHierarchy(nodes: Node[], connections: Connection[]): Node[] {
  if (nodes.length === 0) return nodes;

  // Создаем граф соединений
  const graph = createConnectionGraph(nodes, connections);
  
  // Определяем уровни иерархии
  const levels = calculateHierarchyLevels(nodes, graph);
  
  // Вычисляем позиции для каждого уровня
  const positionedNodes = positionNodesByLevel(levels);

  return positionedNodes;
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
 * Расставляет узлы по вычисленным уровням иерархии
 */
function positionNodesByLevel(levels: HierarchyLevel[]): Node[] {
  const positionedNodes: Node[] = [];
  const config = {
    levelSpacing: 300,  // Расстояние между уровнями
    nodeSpacing: 180,   // Расстояние между узлами на одном уровне
    startX: 100,        // Начальная позиция X
    startY: 100,        // Начальная позиция Y
    nodeWidth: 160      // Примерная ширина узла
  };
  
  levels.forEach((level, levelIndex) => {
    const y = config.startY + levelIndex * config.levelSpacing;
    const totalWidth = (level.nodes.length - 1) * config.nodeSpacing;
    const startX = config.startX - totalWidth / 2;
    
    level.nodes.forEach((node, nodeIndex) => {
      const x = Math.max(50, startX + nodeIndex * config.nodeSpacing);
      
      positionedNodes.push({
        ...node,
        position: { x, y }
      });
    });
  });
  
  return positionedNodes;
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