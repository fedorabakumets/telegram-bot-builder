/**
 * @fileoverview SVG-слой соединений между узлами на холсте
 *
 * Отрисовывает линии переходов между узлами в виде кубических кривых Безье
 * со стрелками на конце. Линия всегда выходит из правого порта (OutputPort)
 * исходного узла и входит в левый бок целевого узла.
 *
 * Поддерживает шесть типов соединений:
 * - auto-transition (зелёный пунктир) — автопереход
 * - button-goto (синий пунктир) — переход по inline-кнопке
 * - input-target (фиолетовый пунктир) — переход после ввода пользователя
 * - trigger-next (жёлтый сплошной) — переход из узла command_trigger
 * - keyboard-link (янтарный пунктир) — привязка message → keyboard
 * - forward-source (янтарно-оранжевый пунктир) — привязка источника для forward_message
 *
 * При наведении на линию появляется кнопка удаления соединения.
 *
 * @module ConnectionsLayer
 */

import { useState } from 'react';
import { Node } from '@/types/bot';
import {
  KEYBOARD_LINK_PORT_TYPE,
  getKeyboardNodeId,
} from './keyboard-connection';

/** Размер SVG-холста — достаточно большой чтобы покрыть любой граф */
const SVG_SIZE = 20000;

/**
 * Тип соединения между узлами
 * "auto-transition" | "button-goto" | "input-target" | "trigger-next" | "condition-source"
 */
type ConnectionType =
  | 'auto-transition'
  | 'button-goto'
  | 'input-target'
  | 'trigger-next'
  | 'condition-source'
  | 'forward-source'
  | typeof KEYBOARD_LINK_PORT_TYPE;

/**
 * Одно соединение между двумя узлами
 */
export interface Connection {
  /** Идентификатор исходного узла */
  fromId: string;
  /** Идентификатор целевого узла */
  toId: string;
  /** Тип соединения */
  type: ConnectionType;
  /** Метка (текст кнопки или название) — опционально */
  label?: string;
  /** ID кнопки — только для button-goto */
  buttonId?: string;
}

interface NodeSize {
  width: number;
  height: number;
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
  'keyboard-link': {
    color: '#f59e0b',
    strokeWidth: 2,
    dashArray: '6 6',
    opacity: 0.7,
    markerId: 'arrow-keyboard',
  },
  /** Соединение исходного узла с узлом condition — оранжевый пунктир */
  'condition-source': {
    color: '#f97316',
    strokeWidth: 2,
    dashArray: '6 4',
    opacity: 0.7,
    markerId: 'arrow-condition',
  },
  'forward-source': {
    color: '#f59e0b',
    strokeWidth: 2,
    dashArray: '4 4',
    opacity: 0.8,
    markerId: 'arrow-forward-source',
  },
};

/**
 * Свойства компонента SVG-слоя соединений
 */
interface ConnectionsLayerProps {
  /** Все узлы текущего листа */
  nodes: Node[];
  /** Карта реальных размеров узлов (из ResizeObserver) */
  nodeSizes: Map<string, NodeSize>;
  /** Колбэк удаления соединения */
  onConnectionDelete?: (fromId: string, toId: string, type: ConnectionType) => void;
  /** Y-смещения портов кнопок от верха узла (buttonId → { x, y } в canvas-координатах) */
  buttonPortYOffsets?: Map<string, { x: number; y: number }>;
  /** ID узла, который сейчас перетаскивается — для подсветки связанных линий */
  draggingNodeId?: string | null;
}

/** На сколько px не доходим до края узла — ровно refX маркера, чтобы кончик стрелки лёг на край */
const MARKER_OFFSET = 9;

/**
 * Смещение по X от правого края contentRect до центра кружка-порта OutputPort.
 *
 * Теперь nodeSizes хранит border-box размеры wrapper-div.
 * OutputPort позиционируется на wrapper-div: right=-8, width=16 → центр на правом краю wrapper.
 * Центр кружка по X = node.position.x + wrapperWidth (правый край wrapper).
 * Но right=-8 означает: правый край кружка = правый край wrapper + 8.
 * Центр кружка = правый край wrapper + 8 - 8 = правый край wrapper = node.position.x + wrapperWidth.
 * Смещение от правого края wrapper до центра кружка = 0, но визуально порт чуть выступает.
 * Используем 0 — border-box width уже включает всё.
 */
const PORT_X_OFFSET = 0;

/**
 * Смещение по X для компактных триггеров.
 * Аналогично PORT_X_OFFSET = 0, так как теперь используем border-box.
 */
const TRIGGER_PORT_X_OFFSET = 0;

/**
 * Вычисляет SVG path кубической кривой Безье между двумя узлами.
 *
 * @param fromNode - Исходный узел
 * @param toNode - Целевой узел
 * @param fromW - border-box ширина исходного узла
 * @param fromH - border-box высота исходного узла
 * @param toW - border-box ширина целевого узла
 * @param toH - border-box высота целевого узла
 * @param fromPortOffset - Переопределение позиции начала линии (для портов кнопок)
 * @returns строка SVG path
 */
function buildSmartPath(
  fromNode: { position: { x: number; y: number }; type?: string },
  toNode: { position: { x: number; y: number }; type?: string },
  fromW: number,
  fromH: number,
  _toW: number,
  toH: number,
  fromPortOffset?: { x: number; y: number },
): string {
  const isTrigger = fromNode.type === 'command_trigger' || fromNode.type === 'text_trigger';
  const xOffset = isTrigger ? TRIGGER_PORT_X_OFFSET : PORT_X_OFFSET;

  // Если передан offset порта кнопки — используем его, иначе правый край + центр узла
  const x1 = fromPortOffset !== undefined
    ? fromNode.position.x + fromPortOffset.x
    : fromNode.position.x + fromW + xOffset;
  const y1 = fromPortOffset !== undefined
    ? fromNode.position.y + fromPortOffset.y
    : fromNode.position.y + fromH / 2;

  const x2 = toNode.position.x - MARKER_OFFSET;
  const y2 = toNode.position.y + toH / 2;

  const dx = Math.abs(x2 - x1);
  const curve = Math.max(60, dx * 0.5);

  return `M ${x1},${y1} C ${x1 + curve},${y1} ${x2 - curve},${y2} ${x2},${y2}`;
}

/**
 * Собирает все соединения из массива узлов
 *
 * @param nodes - Массив узлов
 * @returns Массив соединений
 */
export function collectConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const existingIds = new Set(nodes.map(n => n.id));

  nodes.forEach(node => {
    // 1. Автопереход
    if (node.data?.enableAutoTransition && node.data?.autoTransitionTo) {
      const toId = node.data.autoTransitionTo as string;
      const targetNode = nodes.find((candidate) => candidate.id === toId);
      const isLegacyForwardSourceLink =
        targetNode?.type === 'forward_message' &&
        (targetNode.data as any)?.sourceMessageNodeId === node.id;

      if (existingIds.has(toId) && !isLegacyForwardSourceLink) {
        connections.push({ fromId: node.id, toId, type: 'auto-transition' });
      }
    }

    // 2. Inline кнопки с action === 'goto'
    const buttons: any[] = node.data?.buttons || [];
    buttons.forEach((btn: any) => {
      if (btn.action === 'goto' && btn.target && existingIds.has(btn.target)) {
        // Дедупликация: одна линия на кнопку (по buttonId), а не на пару (from → to)
        const alreadyExists = connections.some(
          c => c.fromId === node.id && c.toId === btn.target && c.type === 'button-goto' && c.buttonId === btn.id
        );
        if (!alreadyExists) {
          connections.push({
            fromId: node.id,
            toId: btn.target,
            type: 'button-goto',
            label: btn.text,
            buttonId: btn.id,
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

    // 4. Соединение триггера команды или текстового триггера с целевым узлом
    if ((node.type === 'command_trigger' || node.type === 'text_trigger') && node.data?.autoTransitionTo) {
      const toId = node.data.autoTransitionTo as string;
      if (existingIds.has(toId)) {
        connections.push({ fromId: node.id, toId, type: 'trigger-next' });
      }
    }

    // 5. Ветки узла условия
    if (node.type === 'condition') {
      const branches: any[] = (node.data as any)?.branches || [];
      branches.forEach((branch: any) => {
        if (branch.target && existingIds.has(branch.target)) {
          connections.push({
            fromId: node.id,
            toId: branch.target,
            type: 'button-goto',
            label: branch.label,
            buttonId: branch.id,
          });
        }
      });
    }

    // 6. Соединение исходного узла с узлом condition (sourceNodeId → condition)
    if (node.type === 'condition') {
      const sourceNodeId = (node.data as any)?.sourceNodeId;
      if (sourceNodeId && existingIds.has(sourceNodeId)) {
        connections.push({
          fromId: sourceNodeId,
          toId: node.id,
          type: 'condition-source',
        });
      }
    }

    // 7. Привязка источника сообщения для forward_message
    if (node.type === 'forward_message') {
      const sourceNodeId = typeof (node.data as any)?.sourceMessageNodeId === 'string'
        ? ((node.data as any).sourceMessageNodeId as string).trim()
        : '';
      const sourceMode = typeof (node.data as any)?.sourceMessageIdSource === 'string'
        ? (node.data as any).sourceMessageIdSource
        : 'current_message';
      if (sourceNodeId && existingIds.has(sourceNodeId) && (sourceMode === 'current_message' || sourceMode === 'last_message')) {
        connections.push({
          fromId: sourceNodeId,
          toId: node.id,
          type: 'forward-source',
        });
      }
    }

    // 8. Отдельная клавиатура у message-узла
    if (node.type === 'message') {
      const keyboardNodeId = getKeyboardNodeId(node.data);
      const keyboardNode = keyboardNodeId ? nodes.find(n => n.id === keyboardNodeId && n.type === 'keyboard') : null;
      if (keyboardNode) {
        connections.push({ fromId: node.id, toId: keyboardNode.id, type: 'keyboard-link' });
      }
    }
  });

  return connections;
}

export function isConnectionRenderable(
  connection: Connection,
  nodeSizes: Map<string, NodeSize>,
  buttonPortYOffsets?: Map<string, { x: number; y: number }>,
): boolean {
  const { fromId, toId, type, buttonId } = connection;

  if (!nodeSizes.has(fromId) || !nodeSizes.has(toId)) {
    return false;
  }

  if (type === 'button-goto' && buttonId && !buttonPortYOffsets?.has(buttonId)) {
    return false;
  }

  return true;
}

export function getRenderableConnections(
  connections: Connection[],
  nodeSizes: Map<string, NodeSize>,
  buttonPortYOffsets?: Map<string, { x: number; y: number }>,
): Connection[] {
  return connections.filter(connection => isConnectionRenderable(connection, nodeSizes, buttonPortYOffsets));
}

/**
 * Компонент SVG-слоя соединений
 *
 * Рисует линии переходов между узлами. При наведении на линию
 * появляется кнопка удаления соединения.
 *
 * @param props - Свойства компонента
 * @returns SVG элемент с линиями соединений или null если нет соединений
 */
export function ConnectionsLayer({ nodes, nodeSizes, onConnectionDelete, buttonPortYOffsets, draggingNodeId }: ConnectionsLayerProps) {
  /** Ширина узла по умолчанию если ResizeObserver ещё не сработал */
  const DEFAULT_WIDTH = 320;
  /** border-box высота узла по умолчанию (до первого срабатывания ResizeObserver) */
  const DEFAULT_HEIGHT = 120;

  /** Ключ соединения под курсором */
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  /** Позиция курсора на линии */
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const connections = collectConnections(nodes);
  if (connections.length === 0) return null;

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const renderableConnections = getRenderableConnections(connections, nodeSizes, buttonPortYOffsets);

  if (renderableConnections.length === 0) return null;

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
        {/* Фильтр свечения для подсветки активных соединений */}
        <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
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
        {/* Подсвеченные стрелки для активных соединений */}
        {Object.entries(CONNECTION_STYLES).map(([, style]) => (
          <marker
            key={`${style.markerId}-active`}
            id={`${style.markerId}-active`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={style.color}
              opacity={1}
            />
          </marker>
        ))}
      </defs>

      {renderableConnections.map(({ fromId, toId, type, buttonId }) => {
        const fromNode = nodeById.get(fromId);
        const toNode = nodeById.get(toId);
        if (!fromNode || !toNode) return null;

        const fromSize = nodeSizes.get(fromId);
        const toSize = nodeSizes.get(toId);

        const fromW = fromSize?.width ?? DEFAULT_WIDTH;
        const fromH = fromSize?.height ?? DEFAULT_HEIGHT;
        const toW = toSize?.width ?? DEFAULT_WIDTH;
        const toH = toSize?.height ?? DEFAULT_HEIGHT;

        // Для button-goto используем точную позицию порта кнопки
        const fromPortOffset = (type === 'button-goto' && buttonId)
          ? buttonPortYOffsets?.get(buttonId)
          : undefined;

        const d = buildSmartPath(fromNode, toNode, fromW, fromH, toW, toH, fromPortOffset);
        const style = CONNECTION_STYLES[type];
        const connKey = `${fromId}->${toId}-${type}-${buttonId ?? 'default'}`;
        const isHovered = hoveredKey === connKey;
        const isActive = draggingNodeId != null && (fromId === draggingNodeId || toId === draggingNodeId);

        return (
          <g
            key={connKey}
            style={{ pointerEvents: 'all' }}
            onMouseEnter={() => setHoveredKey(connKey)}
            onMouseLeave={() => { setHoveredKey(null); setMousePos(null); }}
          >
            {/* Тень для глубины */}
            <path
              d={d}
              fill="none"
              stroke={style.color}
              strokeWidth={style.strokeWidth + 2}
              strokeOpacity={isActive ? 0.35 : 0.1}
              strokeDasharray={style.dashArray || undefined}
            />
            {/* Glow-слой при перетаскивании */}
            {isActive && (
              <path
                d={d}
                fill="none"
                stroke={style.color}
                strokeWidth={style.strokeWidth + 6}
                strokeOpacity={0.25}
                strokeDasharray={style.dashArray || undefined}
                filter="url(#connection-glow)"
              />
            )}
            {/* Основная линия */}
            <path
              d={d}
              fill="none"
              stroke={style.color}
              strokeWidth={isActive ? style.strokeWidth + 2 : isHovered ? style.strokeWidth + 1 : style.strokeWidth}
              strokeOpacity={isActive ? 1 : isHovered ? 1 : style.opacity}
              strokeDasharray={style.dashArray || undefined}
              markerEnd={`url(#${isActive ? `${style.markerId}-active` : style.markerId})`}
              style={isActive ? { transition: 'stroke-opacity 0.2s, stroke-width 0.2s' } : undefined}
            />
            {/* Невидимая широкая зона для hover */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseMove={(e) => {
                const svg = (e.currentTarget as SVGPathElement).ownerSVGElement;
                if (!svg) return;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                setMousePos({ x: svgPt.x, y: svgPt.y });
              }}
            />
            {/* Кнопка удаления рядом с курсором */}
            {isHovered && mousePos && onConnectionDelete && (
              <g
                transform={`translate(${mousePos.x}, ${mousePos.y})`}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onConnectionDelete(fromId, toId, type);
                }}
              >
                <circle r={10} fill="white" stroke={style.color} strokeWidth={1.5} />
                <line x1={-4} y1={-4} x2={4} y2={4} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
                <line x1={4} y1={-4} x2={-4} y2={4} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
