/**
 * @fileoverview Иерархическая раскладка canvas-графа с учетом ролей узлов и реальных связей.
 *
 * Алгоритм строит слои по основным связям сценария, затем отдельно учитывает
 * `condition`, `input`, `media`, `broadcast` и `keyboard`, чтобы линии читались
 * естественнее на canvas и не появлялись лишние прыжки по диагонали.
 */

import { Node } from '@/types/bot';
import { getIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { getKeyboardNodeId } from '@/components/editor/canvas/canvas-node/keyboard-connection';

/**
 * Параметры иерархической раскладки.
 */
interface HierarchicalLayoutOptions {
  /** Высота одного уровня раскладки, оставлена для совместимости с шаблонами. */
  levelHeight: number;
  /** Ширина узла по умолчанию. */
  nodeWidth: number;
  /** Высота узла по умолчанию. */
  nodeHeight: number;
  /** Горизонтальный отступ между слоями. */
  horizontalSpacing: number;
  /** Вертикальный отступ между узлами внутри слоя. */
  verticalSpacing: number;
  /** Начальная координата X. */
  startX: number;
  /** Начальная координата Y. */
  startY: number;
  /** Реальные размеры узлов, если они уже измерены на canvas. */
  nodeSizes?: Map<string, { width: number; height: number }> | undefined;
}

/**
 * Тип связи canvas, который влияет на раскладку.
 */
type LayoutConnectionType =
  | 'auto-transition'
  | 'button-goto'
  | 'input-target'
  | 'trigger-next'
  | 'condition-source'
  | 'keyboard-link'
  | 'forward-source';

/**
 * Упрощенное описание связи canvas для построения графа раскладки.
 */
interface LayoutConnection {
  /** ID исходного узла. */
  fromId: string;
  /** ID целевого узла. */
  toId: string;
  /** Тип связи. */
  type: LayoutConnectionType;
  /** ID кнопки, если связь идет от inline-кнопки. */
  buttonId?: string;
}

/**
 * Структура графа, на которой строится раскладка.
 */
interface LayoutGraph {
  /** Узлы текущего canvas по идентификатору. */
  nodesById: Map<string, Node>;
  /** Основные ориентированные связи, которые формируют слои. */
  mainAdjacency: Map<string, Set<string>>;
  /** Обратные основные связи для barycenter-сортировки. */
  reverseMainAdjacency: Map<string, Set<string>>;
  /** Привязка `keyboard` к хосту `message`. */
  keyboardHostByKeyboardId: Map<string, string>;
  /** Привязка `message` к связанному `keyboard`. */
  keyboardByHostId: Map<string, string>;
  /** Узлы, на которые ведут кнопки конкретного источника. */
  buttonTargetsBySourceId: Map<string, Set<string>>;
}

/**
 * Стандартные параметры раскладки.
 */
const DEFAULT_OPTIONS: HierarchicalLayoutOptions = {
  levelHeight: 100,
  nodeWidth: 320,
  nodeHeight: 120,
  horizontalSpacing: 100,
  verticalSpacing: 80,
  startX: 50,
  startY: 50,
};

/**
 * Узлы, которые естественно являются входом сценария.
 */
const ROOT_TYPES = new Set(['start', 'command_trigger', 'text_trigger']);

/**
 * Узлы-сопровождающие, которые не должны вести себя как полноценный шаг сценария.
 */
const COMPANION_TYPES = new Set(['keyboard']);

/**
 * Узлы контента, которые не ломают основную цепочку сценария.
 */
const CONTENT_TYPES = new Set([
  'message',
  'media',
  'broadcast',
  'sticker',
  'voice',
  'location',
  'contact',
  'client_auth',
  'admin_rights',
  'command',
  'forward_message',
]);

/**
 * Возвращает размер узла, учитывая реальные измерения canvas.
 */
function getNodeSize(nodeId: string, options: HierarchicalLayoutOptions): { width: number; height: number } {
  return options.nodeSizes?.get(nodeId) || { width: options.nodeWidth, height: options.nodeHeight };
}

/**
 * Возвращает роль узла для сортировки внутри слоя.
 */
function getNodeRole(node: Node): 'root' | 'content' | 'input' | 'condition' | 'keyboard' | 'other' {
  if (ROOT_TYPES.has(node.type)) return 'root';
  if (COMPANION_TYPES.has(node.type)) return 'keyboard';
  if (node.type === 'condition') return 'condition';
  if (node.type === 'input') return 'input';
  if (CONTENT_TYPES.has(node.type)) return 'content';
  return 'other';
}

/**
 * Возвращает приоритет узла в пределах одного слоя.
 */
function getNodePriority(node: Node): number {
  switch (getNodeRole(node)) {
    case 'root':
      return 0;
    case 'content':
      return 1;
    case 'input':
      return 2;
    case 'condition':
      return 3;
    case 'keyboard':
      return 4;
    default:
      return 5;
  }
}

/**
 * Добавляет ориентированное ребро в граф, если оба узла существуют.
 */
function addEdge(
  adjacency: Map<string, Set<string>>,
  reverseAdjacency: Map<string, Set<string>>,
  from: string,
  to: string,
  existingIds: Set<string>,
): void {
  if (!from || !to || from === to) return;
  if (!existingIds.has(from) || !existingIds.has(to)) return;

  if (!adjacency.has(from)) adjacency.set(from, new Set());
  if (!reverseAdjacency.has(to)) reverseAdjacency.set(to, new Set());
  adjacency.get(from)!.add(to);
  reverseAdjacency.get(to)!.add(from);
}

/**
 * Проверяет, что значение похоже на объект.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Возвращает массив кнопок из `data.buttons`.
 */
function getButtons(data: unknown): any[] {
  if (!isRecord(data) || !Array.isArray(data.buttons)) return [];
  return data.buttons;
}

/**
 * Строит карту связей message -> keyboard по данным узлов.
 */
function buildKeyboardLinks(nodesById: Map<string, Node>): Map<string, string> {
  const keyboardByHostId = new Map<string, string>();

  for (const node of nodesById.values()) {
    if (node.type !== 'message') continue;

    const keyboardNodeId = getKeyboardNodeId(node.data as Record<string, unknown>);
    if (!keyboardNodeId) continue;

    const keyboardNode = nodesById.get(keyboardNodeId);
    if (!keyboardNode || keyboardNode.type !== 'keyboard') continue;

    keyboardByHostId.set(node.id, keyboardNode.id);
  }

  return keyboardByHostId;
}

/**
 * Возвращает связи для раскладки, если canvas не передал их явно.
 */
function inferConnectionsFromNodes(
  nodesById: Map<string, Node>,
  keyboardByHostId: Map<string, string>,
): LayoutConnection[] {
  const connections: LayoutConnection[] = [];
  const seen = new Set<string>();

  const pushConnection = (connection: LayoutConnection) => {
    const key = `${connection.fromId}->${connection.toId}:${connection.type}:${connection.buttonId ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    connections.push(connection);
  };

  for (const node of nodesById.values()) {
    const data = node.data as Record<string, unknown>;
    const linkedKeyboardId = node.type === 'message' ? keyboardByHostId.get(node.id) ?? null : null;
    const linkedKeyboard = linkedKeyboardId ? nodesById.get(linkedKeyboardId) : null;
    const keyboardButtons = linkedKeyboard ? getButtons(linkedKeyboard.data) : [];
    const nodeButtons = getButtons(data);

    if (node.type === 'message' && linkedKeyboard) {
      pushConnection({
        fromId: node.id,
        toId: linkedKeyboard.id,
        type: 'keyboard-link',
      });
    }

    /**
     * Если у сообщения есть отдельная keyboard-нода, то для layout важны
     * не только сами keyboard-узлы, но и их кнопочные цели: это помогает
     * центровать сообщение между ветками сценария, а не держать его над
     * «пустой» keyboard-обвязкой.
     */
    if (node.type === 'message' && linkedKeyboard && keyboardButtons.length > 0) {
      for (const button of keyboardButtons) {
        if (button?.action === 'goto' && button?.target) {
          pushConnection({
            fromId: node.id,
            toId: button.target,
            type: 'button-goto',
            buttonId: button.id,
          });
        }
      }
    }

    if (node.type === 'condition') {
      const sourceNodeId = typeof data.sourceNodeId === 'string' ? data.sourceNodeId : '';
      if (sourceNodeId) {
        pushConnection({
          fromId: sourceNodeId,
          toId: node.id,
          type: 'condition-source',
        });
      }

      if (Array.isArray(data.branches)) {
        for (const branch of data.branches as any[]) {
          if (branch?.target) {
            pushConnection({
              fromId: node.id,
              toId: branch.target,
              type: 'button-goto',
              buttonId: branch.id,
            });
          }
        }
      }
    }

    const buttonsToUse = node.type === 'message' && linkedKeyboard && keyboardButtons.length > 0
      ? []
      : nodeButtons;
    const sourceId = node.id;

    if (sourceId && Array.isArray(buttonsToUse)) {
      for (const button of buttonsToUse) {
        if (button?.action === 'goto' && button?.target) {
          pushConnection({
            fromId: sourceId,
            toId: button.target,
            type: 'button-goto',
            buttonId: button.id,
          });
        }
      }
    }

    if (typeof data.autoTransitionTo === 'string' && data.autoTransitionTo) {
      pushConnection({
        fromId: node.id,
        toId: data.autoTransitionTo,
        type: node.type === 'command_trigger' || node.type === 'text_trigger' ? 'trigger-next' : 'auto-transition',
      });
    }

    if (node.type === 'forward_message') {
      const sourceNodeId = typeof data.sourceMessageNodeId === 'string' ? data.sourceMessageNodeId.trim() : '';
      const sourceMode = typeof data.sourceMessageIdSource === 'string' ? data.sourceMessageIdSource : 'current_message';
      if (sourceNodeId && (sourceMode === 'current_message' || sourceMode === 'last_message')) {
        pushConnection({
          fromId: sourceNodeId,
          toId: node.id,
          type: 'auto-transition',
        });
      }
    }

    if (typeof data.inputTargetNodeId === 'string' && data.inputTargetNodeId) {
      pushConnection({
        fromId: node.id,
        toId: data.inputTargetNodeId,
        type: 'input-target',
      });
    }
  }

  return connections;
}

/**
 * Собирает граф, на котором потом строится раскладка.
 */
function buildLayoutGraph(nodes: Node[], connections: any[]): LayoutGraph {
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  const existingIds = new Set(nodes.map(node => node.id));
  const keyboardHostByKeyboardId = new Map<string, string>();
  const keyboardByHostId = buildKeyboardLinks(nodesById);
  const buttonTargetsBySourceId = new Map<string, Set<string>>();
  const mainAdjacency = new Map<string, Set<string>>();
  const reverseMainAdjacency = new Map<string, Set<string>>();

  const registerKeyboardLink = (hostId: string, keyboardId: string) => {
    const hostNode = nodesById.get(hostId);
    const keyboardNode = nodesById.get(keyboardId);
    if (!hostNode || !keyboardNode) return;
    if (hostNode.type !== 'message' || keyboardNode.type !== 'keyboard') return;

    keyboardByHostId.set(hostId, keyboardId);
    keyboardHostByKeyboardId.set(keyboardId, hostId);
  };

  /**
   * Регистрирует target кнопки для source-узла, чтобы message сильнее тянулся к своим веткам.
   */
  const registerButtonTarget = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    if (!nodesById.has(sourceId) || !nodesById.has(targetId)) return;

    if (!buttonTargetsBySourceId.has(sourceId)) {
      buttonTargetsBySourceId.set(sourceId, new Set());
    }

    buttonTargetsBySourceId.get(sourceId)!.add(targetId);
  };

  for (const [hostId, keyboardId] of keyboardByHostId) {
    registerKeyboardLink(hostId, keyboardId);
  }

  const sourceConnections = connections.length > 0
    ? (connections as LayoutConnection[])
    : inferConnectionsFromNodes(nodesById, keyboardByHostId);

  for (const connection of sourceConnections) {
    if (!connection || connection.type !== 'keyboard-link') {
      continue;
    }

    if (typeof connection.fromId !== 'string' || typeof connection.toId !== 'string') {
      continue;
    }

    registerKeyboardLink(connection.fromId, connection.toId);
  }

  for (const connection of sourceConnections) {
    if (!connection || typeof connection.fromId !== 'string' || typeof connection.toId !== 'string') {
      continue;
    }

    if (connection.type === 'keyboard-link') {
      continue;
    }

    const sourceNode = nodesById.get(connection.fromId);
    const targetNode = nodesById.get(connection.toId);
    if (!sourceNode || !targetNode) continue;

    let sourceId = connection.fromId;
    if (connection.type === 'button-goto' && keyboardHostByKeyboardId.has(sourceId)) {
      sourceId = keyboardHostByKeyboardId.get(sourceId)!;
    }

    addEdge(mainAdjacency, reverseMainAdjacency, sourceId, connection.toId, existingIds);

    if (connection.type === 'button-goto') {
      registerButtonTarget(sourceId, connection.toId);
    }
  }

  return {
    nodesById,
    mainAdjacency,
    reverseMainAdjacency,
    keyboardHostByKeyboardId,
    keyboardByHostId,
    buttonTargetsBySourceId,
  };
}

/**
 * Строит компоненты сильной связности, чтобы циклы не ломали слои.
 */
function buildStronglyConnectedComponents(
  nodes: Node[],
  adjacency: Map<string, Set<string>>,
): {
  componentByNodeId: Map<string, number>;
  components: string[][];
  componentAdjacency: Map<number, Set<number>>;
  componentReverseAdjacency: Map<number, Set<number>>;
} {
  const nodeIds = nodes.map(node => node.id);
  const nodeSet = new Set(nodeIds);
  const indexMap = new Map<string, number>();
  const lowLinkMap = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];
  let index = 0;

  const visit = (nodeId: string) => {
    indexMap.set(nodeId, index);
    lowLinkMap.set(nodeId, index);
    index += 1;
    stack.push(nodeId);
    onStack.add(nodeId);

    for (const next of adjacency.get(nodeId) || []) {
      if (!nodeSet.has(next)) continue;

      if (!indexMap.has(next)) {
        visit(next);
        lowLinkMap.set(nodeId, Math.min(lowLinkMap.get(nodeId)!, lowLinkMap.get(next)!));
      } else if (onStack.has(next)) {
        lowLinkMap.set(nodeId, Math.min(lowLinkMap.get(nodeId)!, indexMap.get(next)!));
      }
    }

    if (lowLinkMap.get(nodeId) === indexMap.get(nodeId)) {
      const component: string[] = [];
      let current = '';
      do {
        current = stack.pop()!;
        onStack.delete(current);
        component.push(current);
      } while (current !== nodeId);
      components.push(component);
    }
  };

  for (const nodeId of nodeIds) {
    if (!indexMap.has(nodeId)) {
      visit(nodeId);
    }
  }

  const componentByNodeId = new Map<string, number>();
  components.forEach((component, componentId) => {
    for (const nodeId of component) {
      componentByNodeId.set(nodeId, componentId);
    }
  });

  const componentAdjacency = new Map<number, Set<number>>();
  const componentReverseAdjacency = new Map<number, Set<number>>();

  for (const [from, targets] of adjacency) {
    const fromComponent = componentByNodeId.get(from);
    if (fromComponent === undefined) continue;

    for (const to of targets) {
      const toComponent = componentByNodeId.get(to);
      if (toComponent === undefined || toComponent === fromComponent) continue;

      if (!componentAdjacency.has(fromComponent)) componentAdjacency.set(fromComponent, new Set());
      if (!componentReverseAdjacency.has(toComponent)) componentReverseAdjacency.set(toComponent, new Set());
      componentAdjacency.get(fromComponent)!.add(toComponent);
      componentReverseAdjacency.get(toComponent)!.add(fromComponent);
    }
  }

  return {
    componentByNodeId,
    components,
    componentAdjacency,
    componentReverseAdjacency,
  };
}

/**
 * Назначает слой каждой компоненте графа.
 */
function assignComponentLayers(
  nodesById: Map<string, Node>,
  componentByNodeId: Map<string, number>,
  componentAdjacency: Map<number, Set<number>>,
  componentReverseAdjacency: Map<number, Set<number>>,
): Map<number, number> {
  const componentLayers = new Map<number, number>();
  const componentNodeIds = new Map<number, string[]>();

  for (const [nodeId, componentId] of componentByNodeId) {
    if (!componentNodeIds.has(componentId)) componentNodeIds.set(componentId, []);
    componentNodeIds.get(componentId)!.push(nodeId);
  }

  const rootComponents = new Set<number>();
  for (const [componentId, nodeIds] of componentNodeIds) {
    if (nodeIds.some(nodeId => ROOT_TYPES.has(nodesById.get(nodeId)?.type ?? ''))) {
      rootComponents.add(componentId);
      componentLayers.set(componentId, 0);
    }
  }

  const indegree = new Map<number, number>();
  for (const componentId of componentNodeIds.keys()) {
    indegree.set(componentId, componentReverseAdjacency.get(componentId)?.size ?? 0);
  }

  const queue: number[] = [];
  for (const componentId of componentNodeIds.keys()) {
    if ((indegree.get(componentId) ?? 0) === 0) {
      queue.push(componentId);
    }
  }

  if (queue.length === 0 && componentNodeIds.size > 0) {
    queue.push(componentNodeIds.keys().next().value as number);
  }

  const topoOrder: number[] = [];
  while (queue.length > 0) {
    const componentId = queue.shift()!;
    topoOrder.push(componentId);

    for (const childId of componentAdjacency.get(componentId) || []) {
      indegree.set(childId, (indegree.get(childId) ?? 0) - 1);
      if ((indegree.get(childId) ?? 0) === 0) {
        queue.push(childId);
      }
    }
  }

  for (const componentId of topoOrder) {
    const currentLayer = componentLayers.get(componentId) ?? 0;
    for (const childId of componentAdjacency.get(componentId) || []) {
      const nextLayer = currentLayer + 1;
      if (nextLayer > (componentLayers.get(childId) ?? 0)) {
        componentLayers.set(childId, nextLayer);
      }
    }
  }

  for (const componentId of rootComponents) {
    componentLayers.set(componentId, 0);
  }

  for (const componentId of componentNodeIds.keys()) {
    if (!componentLayers.has(componentId)) {
      componentLayers.set(componentId, 0);
    }
  }

  return componentLayers;
}

/**
 * Переводит слой компонентов обратно в слой конкретных узлов.
 */
function expandComponentLayers(
  nodes: Node[],
  componentByNodeId: Map<string, number>,
  componentLayers: Map<number, number>,
  keyboardHostByKeyboardId: Map<string, string>,
): Map<string, number> {
  const layerMap = new Map<string, number>();

  for (const node of nodes) {
    const componentId = componentByNodeId.get(node.id);
    layerMap.set(node.id, componentId === undefined ? 0 : (componentLayers.get(componentId) ?? 0));
  }

  for (const [keyboardId, hostId] of keyboardHostByKeyboardId) {
    layerMap.set(keyboardId, (layerMap.get(hostId) ?? 0) + 1);
  }

  return layerMap;
}

/**
 * Собирает центры соседних узлов, которые находятся в указанном слое.
 */
function collectAdjacentCenters(
  nodeId: string,
  targetLayerIndex: number,
  centersByNodeId: Map<string, number>,
  adjacency: Map<string, Set<string>>,
  layerMap: Map<string, number>,
): number[] {
  const values: number[] = [];

  for (const adjacentId of adjacency.get(nodeId) || []) {
    if ((layerMap.get(adjacentId) ?? -1) !== targetLayerIndex) continue;
    const center = centersByNodeId.get(adjacentId);
    if (center !== undefined) values.push(center);
  }

  return values;
}

/**
 * Собирает центры узлов, связанных с текущим узлом в любом направлении.
 */
function collectConnectedCenters(
  nodeId: string,
  centersByNodeId: Map<string, number>,
  adjacency: Map<string, Set<string>>,
): number[] {
  const values: number[] = [];

  for (const adjacentId of adjacency.get(nodeId) || []) {
    const center = centersByNodeId.get(adjacentId);
    if (center !== undefined) values.push(center);
  }

  return values;
}

/**
 * Возвращает желаемый центр узла внутри слоя на основе соседей и кнопочных веток.
 */
function getDesiredCenter(
  node: Node,
  layerIndex: number,
  centersByNodeId: Map<string, number>,
  graph: LayoutGraph,
  layerMap: Map<string, number>,
): number {
  if (graph.keyboardHostByKeyboardId.has(node.id)) {
    const hostId = graph.keyboardHostByKeyboardId.get(node.id)!;
    const hostCenter = centersByNodeId.get(hostId);
    if (hostCenter !== undefined) return hostCenter;
  }

  if (node.type === 'message') {
    const buttonTargets = graph.buttonTargetsBySourceId.get(node.id);
    if (buttonTargets && buttonTargets.size > 0) {
      const buttonCenters = [...buttonTargets]
        .map(targetId => centersByNodeId.get(targetId))
        .filter((center): center is number => center !== undefined);

      if (buttonCenters.length > 0) {
        /**
         * Для message с кнопками главным ориентиром должны быть именно ветки кнопок,
         * а не сам `keyboard`-блок или входящий trigger.
         */
        return buttonCenters.reduce((sum, value) => sum + value, 0) / buttonCenters.length;
      }
    }
  }

  const outgoingCenters = collectConnectedCenters(node.id, centersByNodeId, graph.mainAdjacency);
  const incomingCenters = collectConnectedCenters(node.id, centersByNodeId, graph.reverseMainAdjacency);

  const outgoingWeight = node.type === 'message' || node.type === 'condition' || ROOT_TYPES.has(node.type) ? 2 : 1;
  const incomingWeight = node.type === 'condition' ? 2 : 1;

  if (outgoingCenters.length > 0 || incomingCenters.length > 0) {
    const weightedSum =
      outgoingCenters.reduce((sum, value) => sum + value * outgoingWeight, 0) +
      incomingCenters.reduce((sum, value) => sum + value * incomingWeight, 0);
    const weightTotal = outgoingCenters.length * outgoingWeight + incomingCenters.length * incomingWeight;
    if (weightTotal > 0) {
      return weightedSum / weightTotal;
    }
  }

  const parentLayerIndex = layerIndex - 1;
  const childLayerIndex = layerIndex + 1;

  const parentCenters = collectAdjacentCenters(node.id, parentLayerIndex, centersByNodeId, graph.reverseMainAdjacency, layerMap);
  if (parentCenters.length > 0) {
    return parentCenters.reduce((sum, value) => sum + value, 0) / parentCenters.length;
  }

  const childCenters = collectAdjacentCenters(node.id, childLayerIndex, centersByNodeId, graph.mainAdjacency, layerMap);
  if (childCenters.length > 0) {
    return childCenters.reduce((sum, value) => sum + value, 0) / childCenters.length;
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * Сортирует узлы внутри слоя по желаемому вертикальному центру.
 */
function sortLayerNodes(
  layerNodes: Node[],
  centersByNodeId: Map<string, number>,
  graph: LayoutGraph,
  layerMap: Map<string, number>,
  layerIndex: number,
): Node[] {
  return [...layerNodes].sort((a, b) => {
    const aCenter = getDesiredCenter(a, layerIndex, centersByNodeId, graph, layerMap);
    const bCenter = getDesiredCenter(b, layerIndex, centersByNodeId, graph, layerMap);
    const aFallback = Number.isFinite(aCenter) ? aCenter : centersByNodeId.get(a.id) ?? Number.POSITIVE_INFINITY;
    const bFallback = Number.isFinite(bCenter) ? bCenter : centersByNodeId.get(b.id) ?? Number.POSITIVE_INFINITY;
    if (aFallback !== bFallback) return aFallback - bFallback;
    const priorityDelta = getNodePriority(a) - getNodePriority(b);
    if (priorityDelta !== 0) return priorityDelta;
    return layerNodes.indexOf(a) - layerNodes.indexOf(b);
  });
}

/**
 * Расставляет узлы слоя по желаемому центру с учетом минимального вертикального зазора.
 */
function placeLayerNodes(
  layerNodes: Node[],
  centersByNodeId: Map<string, number>,
  graph: LayoutGraph,
  layerMap: Map<string, number>,
  layerIndex: number,
  opts: HierarchicalLayoutOptions,
): { orderedNodes: Node[]; centers: Map<string, number> } {
  const orderedNodes = sortLayerNodes(layerNodes, centersByNodeId, graph, layerMap, layerIndex);
  const centers = new Map<string, number>();
  let cursorY = opts.startY;

  for (const node of orderedNodes) {
    const size = getNodeSize(node.id, opts);
    const desiredCenter = getDesiredCenter(node, layerIndex, centersByNodeId, graph, layerMap);
    const targetY = Number.isFinite(desiredCenter)
      ? desiredCenter - size.height / 2
      : cursorY;
    const y = Math.max(cursorY, Math.round(targetY));
    centers.set(node.id, y + size.height / 2);
    cursorY = y + size.height + opts.verticalSpacing;
  }

  return { orderedNodes, centers };
}

/**
 * Выполняет несколько проходов barycenter-раскладки, чтобы уменьшить пересечения и скачки.
 */
function reduceLayerCrossings(
  layers: Node[][],
  graph: LayoutGraph,
  layerMap: Map<string, number>,
  opts: HierarchicalLayoutOptions,
): { layers: Node[][]; centersByNodeId: Map<string, number> } {
  let orderedLayers = layers.map(layer => [...layer]);
  let centersByNodeId = new Map<string, number>();

  for (let pass = 0; pass < 3; pass += 1) {
    for (let layerIndex = 0; layerIndex < orderedLayers.length; layerIndex += 1) {
      const placed = placeLayerNodes(
        orderedLayers[layerIndex],
        centersByNodeId,
        graph,
      layerMap,
      layerIndex,
      opts,
    );
      orderedLayers[layerIndex] = placed.orderedNodes;
      for (const [nodeId, center] of placed.centers) {
        centersByNodeId.set(nodeId, center);
      }
    }

    for (let layerIndex = orderedLayers.length - 1; layerIndex >= 0; layerIndex -= 1) {
      const placed = placeLayerNodes(
        orderedLayers[layerIndex],
        centersByNodeId,
        graph,
      layerMap,
      layerIndex,
      opts,
    );
      orderedLayers[layerIndex] = placed.orderedNodes;
      for (const [nodeId, center] of placed.centers) {
        centersByNodeId.set(nodeId, center);
      }
    }
  }

  return { layers: orderedLayers, centersByNodeId };
}

/**
 * Якорит связанные keyboard-ноды рядом с их message-хостами.
 */
function anchorKeyboardNodes(
  positions: Map<string, { x: number; y: number }>,
  graph: LayoutGraph,
  opts: HierarchicalLayoutOptions,
): void {
  for (const [keyboardId, hostId] of graph.keyboardHostByKeyboardId) {
    const keyboardPosition = positions.get(keyboardId);
    const hostPosition = positions.get(hostId);
    const hostNode = graph.nodesById.get(hostId);
    const keyboardNode = graph.nodesById.get(keyboardId);

    if (!keyboardPosition || !hostPosition || !hostNode || !keyboardNode) continue;

    const hostSize = getNodeSize(hostId, opts);
    const keyboardSize = getNodeSize(keyboardId, opts);
    // Держим keyboard визуально рядом с host, но оставляем более заметный зазор,
    // чтобы узлы не выглядели "слипшимися".
    const xOffset = Math.max(56, Math.round(opts.horizontalSpacing * 0.75));
    const yOffset = Math.max(0, Math.round((hostSize.height - keyboardSize.height) / 2));

    positions.set(keyboardId, {
      x: hostPosition.x + hostSize.width + xOffset,
      y: hostPosition.y + yOffset,
    });
  }
}

/**
 * Группирует узлы по слоям.
 */
function buildLayers(nodes: Node[], layerMap: Map<string, number>): Node[][] {
  const maxLayer = Math.max(...layerMap.values());
  const layers: Node[][] = Array.from({ length: maxLayer + 1 }, () => []);

  for (const node of nodes) {
    const layerIndex = layerMap.get(node.id) ?? 0;
    layers[layerIndex].push(node);
  }

  return layers;
}

/**
 * Использует реальный граф сценария и строит более читаемую иерархическую раскладку.
 */
export function createHierarchicalLayout(
  nodes: Node[],
  connections: any[],
  options: Partial<HierarchicalLayoutOptions> = {},
): Node[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (nodes.length === 0) return nodes;

  const graph = buildLayoutGraph(nodes, connections);
  const scc = buildStronglyConnectedComponents(nodes, graph.mainAdjacency);
  const componentLayers = assignComponentLayers(
    graph.nodesById,
    scc.componentByNodeId,
    scc.componentAdjacency,
    scc.componentReverseAdjacency,
  );
  const layerMap = expandComponentLayers(nodes, scc.componentByNodeId, componentLayers, graph.keyboardHostByKeyboardId);
  const layoutResult = reduceLayerCrossings(buildLayers(nodes, layerMap), graph, layerMap, opts);
  const layers = layoutResult.layers;
  const centersByNodeId = layoutResult.centersByNodeId;
  const positions = new Map<string, { x: number; y: number }>();

  let currentX = opts.startX;
  const layerX: number[] = [];

  for (let li = 0; li < layers.length; li += 1) {
    const layer = layers[li];
    layerX.push(currentX);
    const maxWidth = layer.length > 0
      ? Math.max(...layer.map(node => getNodeSize(node.id, opts).width))
      : opts.nodeWidth;
    const isTriggerLayer = layer.every(node => ROOT_TYPES.has(node.type));
    const spacing = isTriggerLayer ? Math.round(opts.horizontalSpacing * 0.4) : opts.horizontalSpacing;
    currentX += maxWidth + spacing;
  }

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    for (const node of layers[layerIndex]) {
      const size = getNodeSize(node.id, opts);
      const center = centersByNodeId.get(node.id);
      const topY = Number.isFinite(center)
        ? Math.round((center ?? opts.startY) - size.height / 2)
        : opts.startY;
      positions.set(node.id, { x: layerX[layerIndex], y: topY });
    }
  }

  anchorKeyboardNodes(positions, graph, opts);

  const isolatedX = opts.startX + (layers.length + 1) * (opts.nodeWidth + opts.horizontalSpacing);
  let isolatedY = opts.startY;

  return nodes.map(node => {
    const position = positions.get(node.id);
    if (position) {
      return { ...node, position };
    }

    const size = getNodeSize(node.id, opts);
    const fallbackPosition = { x: isolatedX, y: isolatedY };
    isolatedY += size.height + opts.verticalSpacing;
    return { ...node, position: fallbackPosition };
  });
}

/**
 * Специальная раскладка для шаблона vprogulke.
 */
export function createVProgulkeHierarchicalLayout(nodes: Node[], _connections: any[]): Node[] {
  const specialPositions: Record<string, { x: number; y: number }> = {
    start: { x: 100, y: 50 },
    join_request: { x: 100, y: 250 },
    decline_response: { x: 450, y: 250 },
    gender_selection: { x: 100, y: 450 },
    name_input: { x: 450, y: 450 },
    age_input: { x: 800, y: 450 },
    metro_selection: { x: 100, y: 650 },
    interests_categories: { x: 450, y: 650 },
    hobby_interests: { x: 800, y: 650 },
    relationship_status: { x: 100, y: 850 },
    sexual_orientation: { x: 450, y: 850 },
    telegram_channel_ask: { x: 800, y: 850 },
    telegram_channel_input: { x: 100, y: 1050 },
    additional_info: { x: 450, y: 1050 },
    profile_complete: { x: 100, y: 1250 },
    chat_link: { x: 450, y: 1250 },
    show_profile: { x: 800, y: 1250 },
  };

  return nodes.map(node => ({
    ...node,
    position: specialPositions[node.id] || {
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
    },
  }));
}

/**
 * Выбирает подходящую раскладку для текущего шаблона.
 */
export function applyTemplateLayout(
  nodes: Node[],
  connections: any[],
  templateName?: string,
  nodeSizes?: Map<string, { width: number; height: number }>,
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
    nodeSizes,
  };

  const desktopOptions: Partial<HierarchicalLayoutOptions> = {
    levelHeight: 150,
    nodeWidth: 320,
    nodeHeight: 120,
    horizontalSpacing: 100,
    verticalSpacing: 80,
    startX: 100,
    startY: 100,
    nodeSizes,
  };

  return createHierarchicalLayout(nodes, connections, isMobile ? mobileOptions : desktopOptions);
}
