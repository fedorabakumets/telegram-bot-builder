/**
 * @fileoverview Хук управления состоянием drag-to-connect
 *
 * Управляет временным соединением при перетаскивании от порта выхода к целевому узлу.
 * Глобальные обработчики mousemove/mouseup вешаются на document — это гарантирует
 * что drag работает даже когда курсор находится над другим узлом или вне холста.
 *
 * @module use-connection-drag
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Node } from '@/types/bot';
import { PortType } from '../canvas-node/port-colors';
import { setKeyboardNodeId } from '../canvas-node/keyboard-connection';
import {
  getCanvasViewportMetrics,
  screenPointToCanvasPoint,
} from './utils/canvas-coordinate-utils';

/**
 * Состояние временного соединения при drag
 */
export interface DraftConnection {
  /** ID исходного узла */
  fromNodeId: string;
  /** Тип порта */
  portType: PortType;
  /** ID кнопки (только для button-goto) */
  buttonId?: string;
  /** Начальная X в canvas-координатах */
  startX: number;
  /** Начальная Y в canvas-координатах */
  startY: number;
  /** Текущая X в canvas-координатах */
  currentX: number;
  /** Текущая Y в canvas-координатах */
  currentY: number;
}

/**
 * Параметры хука
 */
interface UseConnectionDragParams {
  /** Текущие узлы на холсте */
  nodes: Node[];
  /** Текущий zoom (в процентах) */
  zoom: number;
  /** Текущий pan */
  pan: { x: number; y: number };
  /** Ref на canvas-контейнер */
  canvasRef: React.RefObject<HTMLDivElement>;
  /** Карта размеров узлов */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Колбэк обновления узла */
  onNodeUpdate: (nodeId: string, updater: (node: Node) => Node) => void;
}

/**
 * Результат хука
 */
interface UseConnectionDragResult {
  /** Текущее временное соединение (null если не тянем) */
  draftConnection: DraftConnection | null;
  /** ID узла под курсором (подсветка цели) */
  hoveredTargetNodeId: string | null;
  /** Обработчик mousedown на порту — начинает drag */
  handlePortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number }
  ) => void;
}

export function useConnectionDrag({
  nodes,
  zoom,
  pan,
  canvasRef,
  nodeSizes,
  onNodeUpdate,
}: UseConnectionDragParams): UseConnectionDragResult {
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);

  /**
   * Ref хранит актуальное состояние drag без замыканий.
   * Нужен чтобы глобальные обработчики document видели свежие данные.
   */
  const draftRef = useRef<DraftConnection | null>(null);

  /**
   * Refs для актуальных значений zoom/pan/nodes/nodeSizes —
   * глобальные обработчики не пересоздаются при каждом рендере,
   * поэтому читают значения через ref.
   */
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const nodesRef = useRef(nodes);
  const nodeSizesRef = useRef(nodeSizes);
  const onNodeUpdateRef = useRef(onNodeUpdate);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { nodeSizesRef.current = nodeSizes; }, [nodeSizes]);
  useEffect(() => { onNodeUpdateRef.current = onNodeUpdate; }, [onNodeUpdate]);

  /** Конвертирует экранные координаты в canvas-координаты */
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    // Используем родительский overflow-контейнер (viewport холста), а не сам грид.
    // Грид имеет размер 2000vw×2000vh и его getBoundingClientRect().left/top
    // смещается при скролле, что даёт неверные координаты.
    const container = canvasRef.current?.parentElement ?? canvasRef.current;
    const viewport = getCanvasViewportMetrics(container);
    if (!viewport) return { x: screenX, y: screenY };
    return screenPointToCanvasPoint(screenX, screenY, viewport, panRef.current, zoomRef.current);
  }, [canvasRef]);

  /** Находит узел под canvas-координатами */
  const findNodeAtPoint = useCallback((cx: number, cy: number, excludeId: string, _portType?: PortType): string | null => {
    for (const node of nodesRef.current) {
      if (node.id === excludeId) continue;
      const size = nodeSizesRef.current.get(node.id) ?? { width: 320, height: 200 };
      const { x, y } = node.position;
      if (cx >= x && cx <= x + size.width && cy >= y && cy <= y + size.height) {
        return node.id;
      }
    }
    return null;
  }, []);

  /**
   * Глобальные обработчики document.
   * Вешаются только когда drag активен — это гарантирует что mouseup/mousemove
   * срабатывают даже когда курсор над другим узлом или вне холста.
   */
  useEffect(() => {
    if (!draftConnection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const draft = draftRef.current;
      if (!draft) return;
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const updated = { ...draft, currentX: x, currentY: y };
      draftRef.current = updated;
      setDraftConnection({ ...updated });
      setHoveredTargetNodeId(findNodeAtPoint(x, y, draft.fromNodeId, draft.portType));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const draft = draftRef.current;
      if (!draft) return;

      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const targetId = findNodeAtPoint(x, y, draft.fromNodeId, draft.portType);

      if (targetId) {
        const sourceNode = nodesRef.current.find(n => n.id === draft.fromNodeId);
        const targetNode = nodesRef.current.find(n => n.id === targetId);

        onNodeUpdateRef.current(draft.fromNodeId, (node) => {
          const updated = { ...node, data: { ...(node.data as Record<string, unknown>) } } as Node;
          if (draft.portType === 'trigger-next' || draft.portType === 'auto-transition') {
            /**
             * Сообщение использует один общий порт.
             * При дропе на keyboard создаём привязку клавиатуры,
             * а при дропе на любой другой узел — обычный переход.
             */
            if (draft.portType === 'auto-transition' && sourceNode?.type === 'message' && targetNode?.type === 'keyboard') {
              updated.data = setKeyboardNodeId(updated.data as Record<string, unknown>, targetId) as unknown as Node['data'];
            } else {
              updated.data = {
                ...updated.data,
                autoTransitionTo: targetId,
                ...(draft.portType === 'auto-transition' ? { enableAutoTransition: true } : {}),
              };
            }
          } else if (draft.portType === 'button-goto' && draft.buttonId) {
            const buttons = (updated.data.buttons || []).map((btn: any) =>
              btn.id === draft.buttonId ? { ...btn, target: targetId } : btn
            );
            // condition-узел хранит переходы в branches
            const branches = (updated.data.branches || []).map((b: any) =>
              b.id === draft.buttonId ? { ...b, target: targetId } : b
            );
            updated.data = { ...updated.data, buttons, branches };
          } else if (`${draft.portType}` === 'input-target') {
            updated.data = { ...updated.data, inputTargetNodeId: targetId };
          }
          return updated;
        });
      }

      draftRef.current = null;
      setDraftConnection(null);
      setHoveredTargetNodeId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draftConnection, screenToCanvas, findNodeAtPoint]);

  const handlePortMouseDown = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const node = nodesRef.current.find(n => n.id === nodeId);
    let startX: number;
    let startY: number;

    if (node) {
      const size = nodeSizesRef.current.get(nodeId) ?? { width: 320, height: 200 };
      if (portCenter) {
        // Используем точный центр кружка переданный из OutputPort
        const converted = screenToCanvas(portCenter.x, portCenter.y);
        startX = converted.x;
        startY = converted.y;
      } else {
        // Fallback: правый край узла, середина по высоте
        startX = node.position.x + size.width;
        startY = node.position.y + size.height / 2;
      }
    } else {
      const converted = screenToCanvas(e.clientX, e.clientY);
      startX = converted.x;
      startY = converted.y;
    }

    const draft: DraftConnection = {
      fromNodeId: nodeId,
      portType,
      buttonId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    };
    draftRef.current = draft;
    setDraftConnection(draft);
  }, [screenToCanvas]);

  return {
    draftConnection,
    hoveredTargetNodeId,
    handlePortMouseDown,
  };
}
