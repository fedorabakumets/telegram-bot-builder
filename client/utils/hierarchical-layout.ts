import { Node } from '@/types/bot';
import { getIsMobile } from '@/components/editor/header/hooks/use-mobile';

/**
 * Опции иерархической компоновки
 */
interface HierarchicalLayoutOptions {
  /** Высота одного уровня в иерархии */
  levelHeight: number;
  /** Ширина узла по умолчанию */
  nodeWidth: number;
  /** Высота узла по умолчанию */
  nodeHeight: number;
  /** Горизонтальное расстояние между узлами */
  horizontalSpacing: number;
  /** Вертикальное расстояние между узлами */
  verticalSpacing: number;
  /** Начальная X-координата */
  startX: number;
  /** Начальная Y-координата */
  startY: number;
  /** Карта реальных размеров узлов */
  nodeSizes?: Map<string, { width: number; height: number }> | undefined;
}

/** Стандартные параметры компоновки */
const DEFAULT_OPTIONS: HierarchicalLayoutOptions = {
  levelHeight: 100,
  nodeWidth: 320,
  nodeHeight: 120,
  horizontalSpacing: 80,
  verticalSpacing: 60,
  startX: 50,
  startY: 50
};

function getNodeSize(nodeId: string, options: HierarchicalLayoutOptions): { width: number; height: number } {
  const realSize = options.nodeSizes?.get(nodeId);
  return realSize || { width: options.nodeWidth, height: options.nodeHeight };
}

/**
 * Собирает все рёбра графа из данных узлов.
 * Учитывает: buttons[goto], autoTransitionTo, inputTargetNodeId, branches[target].
 */
function buildEdges(nodes: Node[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  const addEdge = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    if (!adj.has(from)) adj.set(from, new Set());
    adj.get(from)!.add(to);
  };

  for (const node of nodes) {
    const d = node.data as any;

    // Кнопки с action === 'goto'
    if (Array.isArray(d?.buttons)) {
      for (const btn of d.buttons) {
        if (btn.action === 'goto' && btn.target) {
          addEdge(node.id, btn.target);
        }
      }
    }

    // Автопереход
    if (d?.autoTransitionTo) {
      addEdge(node.id, d.autoTransitionTo);
    }

    // Переход по вводу
    if (d?.inputTargetNodeId) {
      addEdge(node.id, d.inputTargetNodeId);
    }

    // Ветки condition-узла
    if (Array.isArray(d?.branches)) {
      for (const branch of d.branches) {
        if (branch.target) {
          addEdge(node.id, branch.target);
        }
      }
    }
  }

  return adj;
}

/**
 * Longest-path layering (Sugiyama step 2).
 * Каждый узел получает слой = максимальная длина пути от корня до него.
 * Возвращает Map<nodeId, layer>.
 */
function assignLayers(
  nodes: Node[],
  adj: Map<string, Set<string>>
): Map<string, number> {
  const nodeIds = new Set(nodes.map(n => n.id));

  // Считаем входящие степени (только для узлов, присутствующих в наборе)
  const inDegree = new Map<string, number>();
  for (const id of nodeIds) inDegree.set(id, 0);

  for (const [from, targets] of adj) {
    if (!nodeIds.has(from)) continue;
    for (const to of targets) {
      if (nodeIds.has(to)) {
        inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
      }
    }
  }

  // Корневые узлы: нет входящих рёбер, или тип start/command_trigger/text_trigger
  const rootTypes = new Set(['start', 'command_trigger', 'text_trigger']);
  const layer = new Map<string, number>();

  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree.get(node.id) === 0 || rootTypes.has(node.type)) {
      layer.set(node.id, 0);
      queue.push(node.id);
    }
  }

  // Если корней нет — берём первый узел
  if (queue.length === 0 && nodes.length > 0) {
    layer.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  // BFS с longest-path: обновляем слой если нашли более длинный путь
  const visited = new Set<string>();
  const bfsQueue = [...queue];

  while (bfsQueue.length > 0) {
    const id = bfsQueue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const currentLayer = layer.get(id) ?? 0;
    const children = adj.get(id);
    if (!children) continue;

    for (const childId of children) {
      if (!nodeIds.has(childId)) continue;
      const childLayer = layer.get(childId) ?? -1;
      const newLayer = currentLayer + 1;
      if (newLayer > childLayer) {
        layer.set(childId, newLayer);
        // Переобходим ребёнка, т.к. его слой изменился
        visited.delete(childId);
        bfsQueue.push(childId);
      }
    }
  }

  // Узлы, которые не были достигнуты — назначаем слой 0
  for (const node of nodes) {
    if (!layer.has(node.id)) {
      layer.set(node.id, 0);
    }
  }

  return layer;
}

/**
 * Barycenter heuristic: сортирует узлы внутри слоя по средней Y-позиции родителей.
 */
function sortLayerByBarycenter(
  layerNodes: Node[],
  prevLayerPositions: Map<string, number>,
  adj: Map<string, Set<string>>
): Node[] {
  // Строим обратный граф для поиска родителей
  const parents = new Map<string, string[]>();
  for (const [from, targets] of adj) {
    for (const to of targets) {
      if (!parents.has(to)) parents.set(to, []);
      parents.get(to)!.push(from);
    }
  }

  const barycenters = layerNodes.map(node => {
    const nodeParents = parents.get(node.id) ?? [];
    const positions = nodeParents
      .map(p => prevLayerPositions.get(p))
      .filter((p): p is number => p !== undefined);

    const avg = positions.length > 0
      ? positions.reduce((s, v) => s + v, 0) / positions.length
      : Infinity;

    return { node, avg };
  });

  barycenters.sort((a, b) => a.avg - b.avg);
  return barycenters.map(b => b.node);
}

/**
 * Sugiyama-style layered layout для DAG.
 *
 * Шаги:
 * 1. Построение графа рёбер из данных узлов
 * 2. Longest-path layering
 * 3. Barycenter sorting внутри слоёв
 * 4. Расчёт позиций с учётом реальных размеров
 * 5. Изолированные узлы — справа
 */
export function createHierarchicalLayout(
  nodes: Node[],
  _connections: any[],
  options: Partial<HierarchicalLayoutOptions> = {}
): Node[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return nodes;

  // Шаг 1: Построение графа
  const adj = buildEdges(nodes);

  // Шаг 2: Назначение слоёв
  const layerMap = assignLayers(nodes, adj);

  // Группируем узлы по слоям
  const maxLayer = Math.max(...layerMap.values());
  const layers: Node[][] = Array.from({ length: maxLayer + 1 }, () => []);

  for (const node of nodes) {
    const l = layerMap.get(node.id) ?? 0;
    layers[l].push(node);
  }

  // Шаг 3: Barycenter sorting — один проход слева направо
  const prevLayerYCenters = new Map<string, number>();

  for (let i = 0; i < layers.length; i++) {
    if (i > 0 && layers[i].length > 1) {
      layers[i] = sortLayerByBarycenter(layers[i], prevLayerYCenters, adj);
    }

    // Вычисляем предварительные Y-центры для следующего прохода
    let y = opts.startY;
    for (const node of layers[i]) {
      const size = getNodeSize(node.id, opts);
      prevLayerYCenters.set(node.id, y + size.height / 2);
      y += size.height + opts.verticalSpacing;
    }
  }

  // Шаг 4: Расчёт X-позиций слоёв (слой 0 слева, далее вправо)
  const layerX: number[] = [];
  let currentX = opts.startX;

  for (let i = 0; i < layers.length; i++) {
    layerX.push(currentX);
    const maxWidth = layers[i].length > 0
      ? Math.max(...layers[i].map(n => getNodeSize(n.id, opts).width))
      : opts.nodeWidth;
    currentX += maxWidth + opts.horizontalSpacing;
  }

  // Шаг 5: Расчёт Y-позиций узлов внутри слоя
  const positions = new Map<string, { x: number; y: number }>();

  for (let i = 0; i < layers.length; i++) {
    let y = opts.startY;
    for (const node of layers[i]) {
      positions.set(node.id, { x: layerX[i], y });
      const size = getNodeSize(node.id, opts);
      y += size.height + opts.verticalSpacing;
    }
  }

  // Шаг 6: Изолированные узлы (не попавшие ни в один слой — не должно быть, но на всякий случай)
  const isolatedX = currentX;
  let isolatedY = opts.startY;

  const result: Node[] = nodes.map(node => {
    let pos = positions.get(node.id);
    if (!pos) {
      const size = getNodeSize(node.id, opts);
      pos = { x: isolatedX, y: isolatedY };
      isolatedY += size.height + opts.verticalSpacing;
    }
    return { ...node, position: pos };
  });

  return result;
}

/**
 * Функция для специального расположения сценария VProgulke.
 * Не изменяется — специфична для одного шаблона.
 */
export function createVProgulkeHierarchicalLayout(nodes: Node[], _connections: any[]): Node[] {
  const specialPositions: Record<string, { x: number; y: number }> = {
    'start': { x: 100, y: 50 },
    'join_request': { x: 100, y: 250 },
    'decline_response': { x: 450, y: 250 },
    'gender_selection': { x: 100, y: 450 },
    'name_input': { x: 450, y: 450 },
    'age_input': { x: 800, y: 450 },
    'metro_selection': { x: 100, y: 650 },
    'interests_categories': { x: 450, y: 650 },
    'hobby_interests': { x: 800, y: 650 },
    'relationship_status': { x: 100, y: 850 },
    'sexual_orientation': { x: 450, y: 850 },
    'telegram_channel_ask': { x: 800, y: 850 },
    'telegram_channel_input': { x: 100, y: 1050 },
    'additional_info': { x: 450, y: 1050 },
    'profile_complete': { x: 100, y: 1250 },
    'chat_link': { x: 450, y: 1250 },
    'show_profile': { x: 800, y: 1250 }
  };

  return nodes.map(node => ({
    ...node,
    position: specialPositions[node.id] || {
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100
    }
  }));
}

/**
 * Автоматически определяет тип сценария и применяет соответствующую компоновку.
 */
export function applyTemplateLayout(
  nodes: Node[],
  connections: any[],
  templateName?: string,
  nodeSizes?: Map<string, { width: number; height: number }>
): Node[] {
  if (templateName?.toLowerCase().includes('vprogulke') || templateName?.toLowerCase().includes('знакомства')) {
    return createVProgulkeHierarchicalLayout(nodes, connections);
  }

  const isMobile = getIsMobile();

  const mobileOptions: Partial<HierarchicalLayoutOptions> = {
    levelHeight: 120,
    nodeWidth: 280,
    nodeHeight: 100,
    horizontalSpacing: 60,
    verticalSpacing: 50,
    startX: 50,
    startY: 50,
    nodeSizes
  };

  const desktopOptions: Partial<HierarchicalLayoutOptions> = {
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
