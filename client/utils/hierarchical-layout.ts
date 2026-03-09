import { Node } from '@/types/bot';
import { getIsMobile } from '@/components/editor/header/hooks/use-mobile';

/**
 * Интерфейс для узла в иерархическом расположении
 * Расширяет базовый интерфейс Node дополнительными полями для алгоритма компоновки
 */
interface LayoutNode extends Node {
  /** Уровень узла в иерархии (0 - самый верхний уровень) */
  level?: number;
  /** Дочерние узлы текущего узла */
  children?: LayoutNode[];
  /** Флаг, указывающий, был ли узел посещен при обходе дерева */
  visited?: boolean;
}

/**
 * Интерфейс для опций иерархической компоновки
 * Определяет параметры для расчета позиций узлов в иерархическом виде
 */
interface HierarchicalLayoutOptions {
  /** Высота одного уровня в иерархии */
  levelHeight: number;
  /** Ширина узла по умолчанию */
  nodeWidth: number;
  /** Высота узла по умолчанию */
  nodeHeight: number; // Добавлена высота узла
  /** Горизонтальное расстояние между узлами */
  horizontalSpacing: number;
  /** Вертикальное расстояние между узлами */
  verticalSpacing: number;
  /** Начальная X-координата для размещения узлов */
  startX: number;
  /** Начальная Y-координата для размещения узлов */
  startY: number;
  /** Карта реальных размеров узлов (если отличаются от стандартных) */
  nodeSizes?: Map<string, { width: number; height: number }> | undefined; // Карта реальных размеров узлов
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

/**
 * Получает размер узла с учетом реальных измерений или дефолтных значений
 *
 * @param nodeId - ID узла, для которого нужно получить размер
 * @param options - опции компоновки, содержащие возможную карту размеров узлов
 * @returns объект с шириной и высотой узла
 */
function getNodeSize(nodeId: string, options: HierarchicalLayoutOptions): { width: number; height: number } {
  const realSize = options.nodeSizes?.get(nodeId);
  return realSize || { width: options.nodeWidth, height: options.nodeHeight };
}

/**
 * Создает иерархическое расположение узлов на основе соединений
 *
 * Алгоритм работает следующим образом:
 * 1. Находит стартовый узел (обычно с типом 'start' или без входящих соединений)
 * 2. Строит дерево зависимостей на основе соединений
 * 3. Вычисляет уровни для каждого узла
 * 4. Группирует узлы по уровням
 * 5. Располагает узлы по уровням с учетом всех особенностей
 *
 * @param nodes - массив узлов для расположения
 * @param connections - массив соединений между узлами
 * @param options - опции компоновки (будут объединены со стандартными опциями)
 * @returns обновленные узлы с новыми позициями
 */
export function createHierarchicalLayout(
  nodes: Node[],
  connections: any[],
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
  console.log('📊 Levels grouped:', levels.length, 'levels, содержимое:', levels.map((level, i) => `Level ${i}: ${level.length} nodes`));

  // Располагаем узлы по уровням
  console.log('🚀 Вызываем arrangeNodesByLevel...');
  const result = arrangeNodesByLevel(levels, connections, opts);
  console.log('✅ arrangeNodesByLevel завершен, результат:', result.length, 'nodes');
  return result;
}

/**
 * Находит стартовый узел (узел типа 'start' или узел без входящих соединений)
 * УЛУЧШЕНИЕ: теперь учитывает автопереходы при определении корневых узлов
 *
 * Функция ищет узел, который может быть началом иерархии. Сначала проверяет наличие
 * узла с типом 'start', затем ищет узлы без входящих соединений (ни обычных, ни автопереходов).
 *
 * @param nodes - массив узлов для анализа
 * @param connections - массив соединений между узлами
 * @returns найденный стартовый узел или null, если не найден
 */
function findStartNode(nodes: LayoutNode[], connections: any[]): LayoutNode | null {
  // Сначала ищем узел типа 'start'
  const startNode = nodes.find(node => node.type === 'start');
  if (startNode) return startNode;

  // Собираем все целевые узлы (и из connections, и из автопереходов)
  const targetIds = new Set(connections.map(c => c.target));

  // УЛУЧШЕНИЕ: Добавляем цели автопереходов
  nodes.forEach(node => {
    const autoTarget = (node as any).data?.autoTransitionTo;
    if (autoTarget) {
      targetIds.add(autoTarget);
    }
  });

  // Ищем узел без входящих соединений (ни обычных, ни автопереходов)
  const rootNodes = nodes.filter(node => !targetIds.has(node.id));
  return rootNodes.length > 0 ? rootNodes[0] : nodes[0];
}

/**
 * Строит дерево зависимостей на основе соединений
 * УЛУЧШЕНИЕ: теперь учитывает автопереходы и правильно обрабатывает порядок для вертикального расположения
 *
 * Функция создает граф соединений, включающий обычные соединения, автопереходы и переходы через кнопки.
 * Автопереходы имеют приоритет над другими типами переходов.
 *
 * @param nodes - массив узлов для построения дерева
 * @param connections - массив соединений между узлами
 * @param startNode - начальный узел, с которого начинается построение дерева
 */
function buildDependencyTree(nodes: LayoutNode[], connections: any[], startNode: LayoutNode) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Создаем граф соединений
  const graph = new Map<string, string[]>();

  // Добавляем обычные соединения
  connections.forEach(connection => {
    if (!graph.has(connection.source)) {
      graph.set(connection.source, []);
    }
    graph.get(connection.source)!.push(connection.target);
  });

  // УЛУЧШЕНИЕ: Добавляем автопереходы в граф (они имеют приоритет)
  nodes.forEach(node => {
    const autoTransitionTarget = (node as any).data?.autoTransitionTo;
    if (autoTransitionTarget) {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }
      // Добавляем автопереход в начало списка для приоритета
      if (!graph.get(node.id)!.includes(autoTransitionTarget)) {
        graph.get(node.id)!.unshift(autoTransitionTarget);
      }
    }

    // УЛУЧШЕНИЕ: Добавляем переходы через кнопки в граф
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      // Сортируем кнопки по порядку для стабильного расположения
      const sortedButtons = [...node.data.buttons].sort((a: any, b: any) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        return orderA - orderB;
      });

      sortedButtons.forEach((button: any) => {
        if (button.target && button.action === 'goto') {
          if (!graph.has(node.id)) {
            graph.set(node.id, []);
          }
          // Добавляем переход через кнопку только если его еще нет
          if (!graph.get(node.id)!.includes(button.target)) {
            graph.get(node.id)!.push(button.target);
          }
        }
      });
    }
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
 * УЛУЧШЕНИЕ: Узлы с несколькими родителями размещаются на уровне самого глубокого родителя + 1
 * ИСПРАВЛЕНИЕ: Защита от бесконечной рекурсии при циклических связях
 *
 * Функция рекурсивно проходит по дереву и присваивает каждому узлу уровень в иерархии.
 * При наличии нескольких родителей узел размещается на уровне самого глубокого родителя + 1.
 * Реализована защита от бесконечной рекурсии при циклических связях.
 *
 * @param startNode - начальный узел для присвоения уровней
 * @param level - текущий уровень (по умолчанию 0)
 * @param visitedInPath - множество узлов, посещенных в текущем пути (для обнаружения циклов)
 */
function assignLevels(startNode: LayoutNode, level = 0, visitedInPath = new Set<string>()) {
  // Проверяем, не находимся ли мы в цикле (узел уже в текущем пути обхода)
  if (visitedInPath.has(startNode.id)) {
    console.warn(`🔄 Обнаружен цикл: узел ${startNode.id} уже обработан. Цепочка:`, Array.from(visitedInPath).join(' -> ') + ' -> ' + startNode.id);
    return;
  }

  // ИСПРАВЛЕНИЕ: Всегда обновляем уровень, если новый уровень глубже
  // Это позволяет узлам с несколькими родителями получить правильный уровень
  const currentLevel = startNode.level ?? -1;
  if (level > currentLevel) {
    startNode.level = level;
  }

  // Если узел уже был полностью обработан с этого или более глубокого уровня,
  // не обходим детей снова (избегаем бесконечной рекурсии)
  if (startNode.visited && level <= currentLevel) {
    return;
  }

  // Отмечаем узел как посещенный
  startNode.visited = true;

  // Добавляем узел в путь для отслеживания циклов
  const newVisitedInPath = new Set(visitedInPath);
  newVisitedInPath.add(startNode.id);

  if (startNode.children) {
    startNode.children.forEach(child => {
      assignLevels(child, level + 1, newVisitedInPath);
    });
  }
}

/**
 * Группирует узлы по уровням
 *
 * Функция создает двумерный массив, где каждый внутренний массив содержит узлы одного уровня.
 * Уровень узла определяется по свойству level.
 *
 * @param nodes - массив узлов с назначенными уровнями
 * @returns двумерный массив узлов, сгруппированных по уровням
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
 *
 * Функция проверяет, перекрываются ли узлы на одном уровне, и корректирует их позиции,
 * чтобы избежать наложения. Учитывает заданные параметры расстояния между узлами.
 *
 * @param nodes - массив узлов с позициями
 * @param options - опции компоновки, содержащие параметры расстояния
 * @returns массив узлов с исправленными позициями (при необходимости)
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
 *
 * Функция реализует основной алгоритм размещения узлов по уровням. Учитывает:
 * - Цепочки автопереходов, размещая их вертикально
 * - Правильное центрирование узлов с несколькими родителями
 * - Корректное распределение узлов по уровням
 *
 * @param levels - двумерный массив узлов, сгруппированных по уровням
 * @param connections - массив соединений между узлами
 * @param options - опции компоновки
 * @returns массив узлов с рассчитанными позициями
 */
function arrangeNodesByLevel(levels: LayoutNode[][], connections: any[], options: HierarchicalLayoutOptions): Node[] {
  console.log('📋 arrangeNodesByLevel вызван');

  const result: Node[] = [];
  let nodeMap: Map<string, LayoutNode>;

  try {
    console.log('  levels:', levels.length);
    console.log('  levels содержимое:', levels.map((l, i) => `Level ${i}: ${l?.length || 0} nodes`));

    const flatNodes = levels.flat().filter(Boolean);
    console.log('  всего узлов после flat:', flatNodes.length);

    // Создаем карту узлов для быстрого доступа
    nodeMap = new Map<string, LayoutNode>();
    flatNodes.forEach(node => {
      if (node && node.id) {
        nodeMap.set(node.id, node);
      }
    });
    console.log('🗺️ Карта узлов создана, размер:', nodeMap.size);
  } catch (error) {
    console.error('❌ ОШИБКА в начале arrangeNodesByLevel:', error);
    throw error;
  }

  // Находим цепочки автопереходов (включая inputTargetNodeId)
  function findAutoTransitionChains(nodes: LayoutNode[]): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();

    // Находим все узлы, которые являются целями ТОЛЬКО автопереходов/inputTarget (не кнопок)
    const isAutoTransitionTarget = new Set<string>();
    nodes.forEach(node => {
      const autoTarget = (node as any).data?.autoTransitionTo;
      const inputTarget = (node as any).data?.inputTargetNodeId;
      if (autoTarget) isAutoTransitionTarget.add(autoTarget);
      if (inputTarget) isAutoTransitionTarget.add(inputTarget);
    });

    // Начинаем цепочки с узлов, которые:
    // 1. Не являются целями автопереходов/inputTarget
    // 2. Или являются стартовыми узлами (type === 'start')
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      if (isAutoTransitionTarget.has(node.id) && node.type !== 'start') return;

      // Проверяем, есть ли у узла любой тип перехода
      const autoTarget = (node as any).data?.autoTransitionTo;
      const inputTarget = (node as any).data?.inputTargetNodeId;
      const firstButtonTarget = node.data.buttons?.find((b: any) => b.action === 'goto')?.target;

      const hasAnyTransition = autoTarget || inputTarget || firstButtonTarget;

      if (hasAnyTransition) {
        const chain: string[] = [];
        let currentNode: LayoutNode | undefined = node;

        // Идем по цепочке переходов (приоритет: автопереход > inputTarget > кнопка)
        while (currentNode && !visited.has(currentNode.id)) {
          chain.push(currentNode.id);
          visited.add(currentNode.id);

          // Определяем следующий узел с приоритетом
          let nextNodeId = (currentNode as any).data?.autoTransitionTo;
          if (!nextNodeId) {
            nextNodeId = (currentNode as any).data?.inputTargetNodeId;
          }
          if (!nextNodeId && currentNode.data.buttons) {
            // Берем первую кнопку с action='goto'
            const gotoButton = currentNode.data.buttons.find((b: any) => b.action === 'goto');
            nextNodeId = gotoButton?.target;
          }

          if (nextNodeId) {
            currentNode = nodeMap.get(nextNodeId);
          } else {
            break;
          }
        }

        if (chain.length > 0) {
          chains.push(chain);
        }
      }
    });

    return chains;
  }

  const autoTransitionChains = findAutoTransitionChains(levels.flat());
  console.log('⛓️ Найдено цепочек автопереходов:', autoTransitionChains.length);
  autoTransitionChains.forEach((chain, index) => {
    console.log(`  Цепочка ${index}:`, chain);
  });

  // Проверяем, является ли узел частью цепочки автопереходов

  // Назначаем y позиции строго по порядку уровней (сверху вниз)
  function assignYPositions(_levelIndex: number, nodeInLevel: LayoutNode, yPosition: number): number {
    const nodeSize = getNodeSize(nodeInLevel.id, options);
    (nodeInLevel as any)._y = yPosition;
    return yPosition + nodeSize.height + options.verticalSpacing;
  }

  // Создаем карту входящих соединений для каждого узла
  const incomingConnections = new Map<string, string[]>();

  // Собираем все соединения (обычные + из кнопок + автопереходы)
  const flatNodes = levels.flat();
  flatNodes.forEach(node => {
    // Обычные соединения
    const regularConnections = connections.filter((c: any) => c.target === node.id).map((c: any) => c.source);

    // Соединения через кнопки
    const buttonConnections = flatNodes
      .filter(n => n.data.buttons?.some((b: any) => b.action === 'goto' && b.target === node.id))
      .map(n => n.id);

    // Автопереходы
    const autoConnections = flatNodes
      .filter(n => (n.data as any).autoTransitionTo === node.id || (n.data as any).inputTargetNodeId === node.id)
      .map(n => n.id);

    const allParents = Array.from(new Set([...regularConnections, ...buttonConnections, ...autoConnections]));
    if (allParents.length > 0) {
      incomingConnections.set(node.id, allParents);
    }
  });

  // Назначаем Y позиции строго по уровням (сверху вниз)
  let currentY = options.startY;

  levels.forEach((levelNodes, levelIndex) => {
    levelNodes.forEach(node => {
      currentY = assignYPositions(levelIndex, node, currentY);
    });
  });

  // Создаем результат с правильными позициями
  const processedNodes = new Set<string>();

  // Обрабатываем цепочки автопереходов - ВЕРТИКАЛЬНО для линейных цепочек
  autoTransitionChains.forEach((chain, chainIndex) => {
    console.log(`🔗 Обрабатываем цепочку автопереходов ${chainIndex}:`, chain);

    if (chain.length === 0) return;

    // Находим первый узел цепочки для определения начальной позиции
    const firstNode = nodeMap.get(chain[0]);
    if (!firstNode) {
      console.warn(`  ⚠️ Первый узел цепочки ${chain[0]} не найден`);
      return;
    }

    // Используем Y позицию первого узла (уже вычисленную в assignYPositions)
    let currentY = (firstNode as any)._y || options.startY;
    const chainX = options.startX;

    // Располагаем узлы цепочки СТРОГО ВЕРТИКАЛЬНО (без центрирования)
    chain.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (!node) {
        console.warn(`  ⚠️ Узел ${nodeId} не найден в nodeMap`);
        return;
      }

      const nodeSize = getNodeSize(nodeId, options);

      console.log(`  ⬇️ Узел ${index + 1}/${chain.length} (${nodeId}): x=${chainX}, y=${currentY}`);

      // Убираем циклические свойства перед добавлением в результат
      const { children, visited, level, ...cleanNode } = node;
      result.push({
        ...cleanNode,
        position: { x: chainX, y: currentY }
      });

      processedNodes.add(nodeId);
      // Переходим к следующей позиции по вертикали
      currentY += nodeSize.height + options.verticalSpacing;
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

      let y = (node as any)._y || (options.startY + result.length * options.verticalSpacing);

      // ЦЕНТРИРОВАНИЕ: если у узла несколько родителей, центрируем его между ними
      const parents = incomingConnections.get(node.id);
      if (parents && parents.length > 1) {
        // Находим позиции всех родительских узлов
        const parentPositions = parents
          .map(parentId => {
            // Ищем родителя в уже обработанных узлах
            const parentInResult = result.find(n => n.id === parentId);
            if (parentInResult) {
              const parentSize = getNodeSize(parentId, options);
              return parentInResult.position.y + parentSize.height / 2;
            }
            return null;
          })
          .filter(pos => pos !== null) as number[];

        if (parentPositions.length > 0) {
          // Вычисляем среднюю Y-позицию родителей
          const avgParentY = parentPositions.reduce((sum, py) => sum + py, 0) / parentPositions.length;
          const nodeSize = getNodeSize(node.id, options);
          // Центрируем узел относительно средней позиции родителей
          y = avgParentY - nodeSize.height / 2;
          console.log(`📍 Центрирование узла ${node.id} между ${parents.length} родителями: y=${y}`);
        }
      }

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
 * Линейное расположение узлов (резервный вариант)
 *
 * Функция используется в случае, когда невозможно построить иерархию.
 * Размещает узлы в линейном порядке с заданными параметрами расстояния.
 *
 * @param nodes - массив узлов для линейного размещения
 * @param options - опции компоновки
 * @returns массив узлов с линейно распределенными позициями
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
 *
 * Функция реализует специфическое размещение узлов для шаблона VProgulke (бот знакомств).
 * Использует заранее определенные позиции для каждого типа узла в соответствии с логикой бота.
 *
 * @param nodes - массив узлов для размещения
 * @param _connections - массив соединений между узлами
 * @returns массив узлов с заранее определенными позициями для шаблона VProgulke
 */
export function createVProgulkeHierarchicalLayout(nodes: Node[], _connections: any[]): Node[] {
  // Определяем последовательность узлов для VProgulke бота

  // Создаем карту узлов для быстрого доступа

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
 *
 * Функция анализирует имя шаблона и применяет соответствующий алгоритм размещения узлов.
 * Для шаблона VProgulke используется специальное размещение, для остальных - стандартная
 * иерархическая компоновка с учетом типа устройства (мобильное/десктоп).
 *
 * @param nodes - массив узлов для размещения
 * @param connections - массив соединений между узлами
 * @param templateName - название шаблона (опционально)
 * @param nodeSizes - карта реальных размеров узлов (опционально)
 * @returns массив узлов с примененной компоновкой
 */
export function applyTemplateLayout(
  nodes: Node[],
  connections: any[],
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