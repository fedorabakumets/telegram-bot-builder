/**
 * @fileoverview SVG-слой соединений между узлами на холсте
 *
 * Отрисовывает линии переходов между узлами в виде кубических кривых Безье
 * со стрелками на конце. Поддерживает четыре типа соединений:
 * - auto-transition (зелёный пунктир) — автопереход
 * - button-goto (синий пунктир) — переход по inline-кнопке
 * - input-target (фиолетовый пунктир) — переход после ввода пользователя
 * - trigger-next (жёлтый сплошной) — переход из узла command_trigger
 *
 * Слой абсолютно позиционирован и не перехватывает события мыши.
 *
 * @module ConnectionsLayer
 */

import { Node } from '@/types/bot';

/** Размер SVG-холста — достаточно большой чтобы покрыть любой граф */
const SVG_SIZE = 20000;

/**
 * Тип соединения между узлами
 * "auto-transition" | "button-goto" | "input-target" | "trigger-next"
 */
type ConnectionType = 'auto-transition' | 'button-goto' | 'input-target' | 'trigger-next';

/**
 * Одно соединение между двумя узлами
 */
interface Connection {
  /** Идентификатор исходного узла */
  fromId: string;
  /** Идентификатор целевого узла */
  toId: string;
  /** Тип соединения */
  type: ConnectionType;
  /** Метка (текст кнопки или название) — опционально */
  label?: string;
}

/**
 * Визуальные параметры для каждого типа соединения
 */
interface ConnectionStyle {
  /** Цвет линии и стрелки */
  color: string;
  /** Ширина линии */
  strokeWidth: number;
  /** Паттерн пунктира (пустая строка = сплошная) */
  dashArray: string;
  /** Прозрачность линии */
  opacity: number;
  /** ID маркера стрелки */
  markerId: string;
}

/**
 * Карта стилей по типу соединения
 */
const CONNECTION_STYLES: Record<ConnectionType, ConnectionStyle> = {
  'auto-transition': {
    color: '#22c55e',
    strokeWidth: 2,
    dashArray: '8 5',
    opacity: 0.8,
    markerId: 'arrow-auto',
  },
  'button-goto': {
    color: '#3b82f6',
    strokeWidth: 2,
    dashArray: '8 5',
    opacity: 0.8,
    markerId: 'arrow-button',
  },
  'input-target': {
    color: '#a855f7',
    strokeWidth: 2,
    dashArray: '8 5',
    opacity: 0.8,
    markerId: 'arrow-input',
  },
  /** Соединение триггера команды с целевым узлом — жёлтый сплошной */
  'trigger-next': {
    color: '#eab308',
    strokeWidth: 2,
    dashArray: '',
    opacity: 0.8,
    markerId: 'arrow-trigger',
  },
};

/**
 * Свойства компонента SVG-слоя соединений
 */
interface ConnectionsLayerProps {
  /** Все узлы текущего листа */
  nodes: Node[];
  /** Карта реальных размеров узлов (из ResizeObserver) */
  nodeSizes: Map<string, { width: number; height: number }>;
}

/**
 * Вычисляет SVG path кубической кривой Безье между двумя узлами
 * с умной маршрутизацией: если цель сбоку — соединяем боковые стороны,
 * если снизу/сверху — верх/низ.
 *
 * @param fromNode - Исходный узел
 * @param toNode - Целевой узел
 * @param fromW - Ширина исходного узла
 * @param fromH - Высота исходного узла
 * @param toW - Ширина целевого узла
 * @param toH - Высота целевого узла
 * @returns строка SVG path
 */
/** На сколько px не доходим до края узла — ровно refX маркера, чтобы кончик стрелки лёг на край */
const MARKER_OFFSET = 9;

function buildSmartPath(
  fromNode: { position: { x: number; y: number } },
  toNode: { position: { x: number; y: number } },
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
): string {
  const fromCX = fromNode.position.x + fromW / 2;
  const fromCY = fromNode.position.y + fromH / 2;
  const toCX = toNode.position.x + toW / 2;
  const toCY = toNode.position.y + toH / 2;

  const dx = toCX - fromCX;
  const dy = toCY - fromCY;

  // Если горизонтальное смещение доминирует — соединяем боковые стороны
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      // цель справа: выход из правой стороны → вход в левую
      const x1 = fromNode.position.x + fromW;
      const y1 = fromCY;
      const x2 = toNode.position.x - MARKER_OFFSET;
      const y2 = toCY;
      const curve = Math.max(40, Math.abs(dx) * 0.4);
      return `M ${x1},${y1} C ${x1 + curve},${y1} ${x2 - curve},${y2} ${x2},${y2}`;
    } else {
      // цель слева: выход из левой стороны → вход в правую
      const x1 = fromNode.position.x;
      const y1 = fromCY;
      const x2 = toNode.position.x + toW + MARKER_OFFSET;
      const y2 = toCY;
      const curve = Math.max(40, Math.abs(dx) * 0.4);
      return `M ${x1},${y1} C ${x1 - curve},${y1} ${x2 + curve},${y2} ${x2},${y2}`;
    }
  }

  // Вертикальное: выход снизу → вход сверху (или наоборот)
  if (dy > 0) {
    const x1 = fromCX;
    const y1 = fromNode.position.y + fromH;
    const x2 = toCX;
    const y2 = toNode.position.y - MARKER_OFFSET;
    const curve = Math.max(60, Math.abs(dy) * 0.5);
    return `M ${x1},${y1} C ${x1},${y1 + curve} ${x2},${y2 - curve} ${x2},${y2}`;
  } else {
    // цель выше: выход сверху → вход снизу
    const x1 = fromCX;
    const y1 = fromNode.position.y;
    const x2 = toCX;
    const y2 = toNode.position.y + toH + MARKER_OFFSET;
    const curve = Math.max(60, Math.abs(dy) * 0.5);
    return `M ${x1},${y1} C ${x1},${y1 - curve} ${x2},${y2 + curve} ${x2},${y2}`;
  }
}

/**
 * Собирает все соединения из массива узлов
 *
 * @param nodes - Массив узлов
 * @returns Массив соединений
 */
function collectConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const existingIds = new Set(nodes.map(n => n.id));

  nodes.forEach(node => {
    // 1. Автопереход
    if (node.data?.enableAutoTransition && node.data?.autoTransitionTo) {
      const toId = node.data.autoTransitionTo as string;
      if (existingIds.has(toId)) {
        connections.push({ fromId: node.id, toId, type: 'auto-transition' });
      }
    }

    // 2. Inline кнопки с action === 'goto'
    const buttons: any[] = node.data?.buttons || [];
    buttons.forEach((btn: any) => {
      if (btn.action === 'goto' && btn.target && existingIds.has(btn.target)) {
        // Дедупликация: одна линия на пару (from → to) для button-goto
        const alreadyExists = connections.some(
          c => c.fromId === node.id && c.toId === btn.target && c.type === 'button-goto'
        );
        if (!alreadyExists) {
          connections.push({
            fromId: node.id,
            toId: btn.target,
            type: 'button-goto',
            label: btn.text,
          });
        }
      }
    });

    // 3. Input target — куда идёт после ввода пользователя
    const inputTargetNodeId = (node.data as any)?.inputTargetNodeId;
    if (inputTargetNodeId && existingIds.has(inputTargetNodeId)) {
      connections.push({
        fromId: node.id,
        toId: inputTargetNodeId,
        type: 'input-target',
      });
    }

    // 4. Соединение триггера команды с целевым узлом
    if (node.type === 'command_trigger' && node.data?.autoTransitionTo) {
      const toId = node.data.autoTransitionTo as string;
      if (existingIds.has(toId)) {
        connections.push({ fromId: node.id, toId, type: 'trigger-next' });
      }
    }
  });

  return connections;
}

/**
 * Компонент SVG-слоя соединений
 *
 * Рисует линии переходов между узлами. Линия выходит из нижней середины
 * исходного узла и входит в верхнюю середину целевого узла.
 *
 * @param props - Свойства компонента
 * @returns SVG элемент с линиями соединений или null если нет соединений
 */
export function ConnectionsLayer({ nodes, nodeSizes }: ConnectionsLayerProps) {
  /** Ширина узла по умолчанию если ResizeObserver ещё не сработал */
  const DEFAULT_WIDTH = 320;
  /** Высота узла по умолчанию */
  const DEFAULT_HEIGHT = 200;

  const connections = collectConnections(nodes);
  if (connections.length === 0) return null;

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SVG_SIZE,
        height: SVG_SIZE,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 5,
      }}
    >
      <defs>
        {/* Стрелки для каждого типа соединения */}
        {Object.entries(CONNECTION_STYLES).map(([, style]) => (
          <marker
            key={style.markerId}
            id={style.markerId}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={style.color}
              opacity={style.opacity}
            />
          </marker>
        ))}
      </defs>

      {connections.map(({ fromId, toId, type }, idx) => {
        const fromNode = nodeById.get(fromId);
        const toNode = nodeById.get(toId);
        if (!fromNode || !toNode) return null;

        const fromSize = nodeSizes.get(fromId);
        const toSize = nodeSizes.get(toId);

        const fromW = fromSize?.width ?? DEFAULT_WIDTH;
        const fromH = fromSize?.height ?? DEFAULT_HEIGHT;
        const toW = toSize?.width ?? DEFAULT_WIDTH;
        const toH = toSize?.height ?? DEFAULT_HEIGHT;

        const d = buildSmartPath(fromNode, toNode, fromW, fromH, toW, toH);
        const style = CONNECTION_STYLES[type];

        return (
          <g key={`${fromId}->${toId}-${type}-${idx}`}>
            {/* Тень для глубины */}
            <path
              d={d}
              fill="none"
              stroke={style.color}
              strokeWidth={style.strokeWidth + 2}
              strokeOpacity={0.1}
              strokeDasharray={style.dashArray || undefined}
            />
            {/* Основная линия */}
            <path
              d={d}
              fill="none"
              stroke={style.color}
              strokeWidth={style.strokeWidth}
              strokeOpacity={style.opacity}
              strokeDasharray={style.dashArray || undefined}
              markerEnd={`url(#${style.markerId})`}
            />
          </g>
        );
      })}
    </svg>
  );
}
