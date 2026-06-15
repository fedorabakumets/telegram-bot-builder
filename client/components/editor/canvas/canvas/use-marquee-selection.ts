/**
 * @fileoverview Хук состояния мульти-выделения узлов рамкой (marquee selection)
 * @module canvas/use-marquee-selection
 */

import { useState, useCallback, useRef } from 'react';
import { MarqueeRect, MarqueeNode, getNodesInMarquee } from './utils/marquee-intersection';

/** Активный инструмент холста: курсор или рамочное выделение */
export type CanvasTool = 'pointer' | 'marquee';

/** Параметры завершения рамки для вычисления попавших узлов */
export interface FinishMarqueeParams {
  /** Узлы текущего листа с позициями */
  nodes: MarqueeNode[];
  /** Карта реальных размеров узлов */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Текущее смещение холста */
  pan: { x: number; y: number };
  /** Текущий масштаб в процентах */
  zoom: number;
}

/**
 * Хук управления состоянием мульти-выделения узлов рамкой.
 *
 * @returns Состояние инструмента, выделения, рамки и функции управления ими
 */
export function useMarqueeSelection() {
  /** Текущий активный инструмент */
  const [tool, setTool] = useState<CanvasTool>('pointer');
  /** Множество выделенных узлов */
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  /** Текущая рисуемая рамка (null если не рисуется) */
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  /** Ref-зеркало рамки для доступа к актуальному значению в finishMarquee */
  const marqueeRectRef = useRef<MarqueeRect | null>(null);

  /** Переключает инструмент pointer ↔ marquee */
  const toggleTool = useCallback(() => {
    setTool(prev => (prev === 'marquee' ? 'pointer' : 'marquee'));
  }, []);

  /** Начинает рисование рамки в точке (screen-координаты холста) */
  const startMarquee = useCallback((x: number, y: number) => {
    const rect = { startX: x, startY: y, currentX: x, currentY: y };
    marqueeRectRef.current = rect;
    setMarqueeRect(rect);
  }, []);

  /** Обновляет текущую точку рамки при движении мыши */
  const updateMarquee = useCallback((x: number, y: number) => {
    setMarqueeRect(prev => {
      if (!prev) return null;
      const next = { ...prev, currentX: x, currentY: y };
      marqueeRectRef.current = next;
      return next;
    });
  }, []);

  /**
   * Завершает рамку: вычисляет попавшие узлы и сохраняет их в выделение.
   *
   * @param params - Узлы, размеры, pan и zoom для перевода координат
   */
  const finishMarquee = useCallback((params: FinishMarqueeParams) => {
    const rect = marqueeRectRef.current;
    marqueeRectRef.current = null;
    setMarqueeRect(null);
    if (!rect) return;
    const ids = getNodesInMarquee(rect, params.nodes, params.nodeSizes, params.pan, params.zoom);
    setSelectedNodeIds(ids);
  }, []);

  /** Полностью очищает выделение */
  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
  }, []);

  /** Добавляет или убирает узел из выделения (для Shift+клик) */
  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  return {
    tool,
    setTool,
    toggleTool,
    selectedNodeIds,
    setSelectedNodeIds,
    marqueeRect,
    startMarquee,
    updateMarquee,
    finishMarquee,
    clearSelection,
    toggleNodeSelection,
  };
}
