/**
 * @fileoverview Хук управления состоянием drag-to-connect
 *
 * Управляет временным соединением при перетаскивании от порта выхода к целевому узлу.
 * Определяет допустимые цели, обновляет данные узла при завершении drag.
 *
 * @module use-connection-drag
 */

import { useState, useCallback, useRef } from 'react';
import { Node } from '@/types/bot';
import { PortType } from '../canvas-node/port-colors';

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
  /** Обработчик mousedown на порту */
  handlePortMouseDown: (e: React.MouseEvent, nodeId: string, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
  /** Обработчик mousemove на canvas */
  handleDragMouseMove: (e: React.MouseEvent) => void;
  /** Обработчик mouseup на canvas */
  handleDragMouseUp: (e: React.MouseEvent) => void;
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
  const draftRef = useRef<DraftConnection | null>(null);

  /** Конвертирует экранные координаты в canvas-координаты */
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    // Используем родительский overflow-контейнер (viewport холста), а не сам грид.
    // Грид имеет размер 2000vw×2000vh и его getBoundingClientRect().left/top
    // смещается при скролле, что даёт неверные координаты.
    const container = canvasRef.current?.parentElement ?? canvasRef.current;
    const rect = container?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };
    const x = (screenX - rect.left - pan.x) / (zoom / 100);
    const y = (screenY - rect.top - pan.y) / (zoom / 100);
    return { x, y };
  }, [canvasRef, pan, zoom]);

  /** Находит узел под canvas-координатами */
  const findNodeAtPoint = useCallback((cx: number, cy: number, excludeId: string): string | null => {
    for (const node of nodes) {
      if (node.id === excludeId) continue;
      const size = nodeSizes.get(node.id) ?? { width: 320, height: 200 };
      const { x, y } = node.position;
      if (cx >= x && cx <= x + size.width && cy >= y && cy <= y + size.height) {
        return node.id;
      }
    }
    return null;
  }, [nodes, nodeSizes]);

  const handlePortMouseDown = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Вычисляем startX/startY из canvas-координат узла + позиции порта.
    // Это надёжнее чем getBoundingClientRect, который зависит от скролла и zoom.
    const node = nodes.find(n => n.id === nodeId);
    let startX: number;
    let startY: number;

    if (node) {
      const size = nodeSizes.get(nodeId) ?? { width: 320, height: 200 };
      if (portCenter) {
        // Всегда используем точный центр кружка из getBoundingClientRect
        const converted = screenToCanvas(portCenter.x, portCenter.y);
        startX = converted.x;
        startY = converted.y;
      } else {
        // Fallback: правый край узла, середина по высоте
        startX = node.position.x + size.width;
        startY = node.position.y + size.height / 2;
      }
    } else {
      // Fallback: конвертируем позицию курсора
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
  }, [nodes, nodeSizes, screenToCanvas]);

  const handleDragMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draftRef.current) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const updated = { ...draftRef.current, currentX: x, currentY: y };
    draftRef.current = updated;
    setDraftConnection(updated);

    const targetId = findNodeAtPoint(x, y, draftRef.current.fromNodeId);
    setHoveredTargetNodeId(targetId);
  }, [screenToCanvas, findNodeAtPoint]);

  const handleDragMouseUp = useCallback((e: React.MouseEvent) => {
    const draft = draftRef.current;
    if (!draft) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const targetId = findNodeAtPoint(x, y, draft.fromNodeId);

    if (targetId) {
      onNodeUpdate(draft.fromNodeId, (node) => {
        const updated = { ...node, data: { ...node.data } };
        if (draft.portType === 'trigger-next' || draft.portType === 'auto-transition') {
          updated.data = {
            ...updated.data,
            autoTransitionTo: targetId,
            ...(draft.portType === 'auto-transition' ? { enableAutoTransition: true } : {}),
          };
        } else if (draft.portType === 'button-goto' && draft.buttonId) {
          const buttons = (updated.data.buttons || []).map((btn: any) =>
            btn.id === draft.buttonId ? { ...btn, target: targetId } : btn
          );
          updated.data = { ...updated.data, buttons };
        }
        return updated;
      });
    }

    draftRef.current = null;
    setDraftConnection(null);
    setHoveredTargetNodeId(null);
  }, [screenToCanvas, findNodeAtPoint, onNodeUpdate]);

  return {
    draftConnection,
    hoveredTargetNodeId,
    handlePortMouseDown,
    handleDragMouseMove,
    handleDragMouseUp,
  };
}
