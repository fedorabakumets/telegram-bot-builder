/**
 * @fileoverview Хук управления мультиселектом узлов на канвасе.
 */

import { useState, useCallback } from 'react';
import { Node } from '@/types/bot';

export interface SelectionRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function useMultiselect(nodes: Node[], pan: { x: number; y: number }, zoom: number) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(nodes.map(n => n.id)));
  }, [nodes]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionRect(null);
  }, []);

  const startRect = useCallback((screenX: number, screenY: number) => {
    setSelectionRect({ startX: screenX, startY: screenY, currentX: screenX, currentY: screenY });
  }, []);

  const updateRect = useCallback((screenX: number, screenY: number) => {
    setSelectionRect(prev => prev ? { ...prev, currentX: screenX, currentY: screenY } : null);
  }, []);

  /**
   * Финализирует рамку: определяет узлы, попавшие в неё, и выделяет их.
   * Рамка задана в экранных координатах относительно канваса.
   * Узлы позиционированы в canvas-координатах.
   */
  const finalizeRect = useCallback((
    canvasRect: DOMRect,
    nodeSizes: Map<string, { width: number; height: number }>
  ) => {
    if (!selectionRect) return;

    const zoomFactor = zoom / 100;

    // Рамка в экранных координатах относительно канваса
    const rectLeft = Math.min(selectionRect.startX, selectionRect.currentX);
    const rectRight = Math.max(selectionRect.startX, selectionRect.currentX);
    const rectTop = Math.min(selectionRect.startY, selectionRect.currentY);
    const rectBottom = Math.max(selectionRect.startY, selectionRect.currentY);

    // Переводим рамку в canvas-координаты
    const canvasLeft = (rectLeft - canvasRect.left - pan.x) / zoomFactor;
    const canvasRight = (rectRight - canvasRect.left - pan.x) / zoomFactor;
    const canvasTop = (rectTop - canvasRect.top - pan.y) / zoomFactor;
    const canvasBottom = (rectBottom - canvasRect.top - pan.y) / zoomFactor;

    const newSelected = new Set<string>();
    for (const node of nodes) {
      const size = nodeSizes.get(node.id) ?? { width: 320, height: 200 };
      const nodeLeft = node.position.x;
      const nodeRight = node.position.x + size.width;
      const nodeTop = node.position.y;
      const nodeBottom = node.position.y + size.height;

      // Пересечение прямоугольников
      if (nodeLeft < canvasRight && nodeRight > canvasLeft &&
          nodeTop < canvasBottom && nodeBottom > canvasTop) {
        newSelected.add(node.id);
      }
    }

    setSelectedIds(newSelected);
    setSelectionRect(null);
  }, [selectionRect, nodes, pan, zoom]);

  return {
    selectedIds,
    selectionRect,
    toggle,
    selectAll,
    clear,
    startRect,
    updateRect,
    finalizeRect,
    setSelectedIds,
  };
}
