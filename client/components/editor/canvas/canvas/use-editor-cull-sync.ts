/**
 * @fileoverview Повтор куллинга после коммита камеры, без setState на кадр жеста
 * @module editor/canvas/use-editor-cull-sync
 */

import { useLayoutEffect, type MutableRefObject, type RefObject } from 'react';
import { cullCanvasNodes, type CullNodeSize } from './cull-canvas-nodes';

/** Аргументы синхронизации куллинга с итоговой камерой */
interface UseEditorCullSyncOptions {
  /** Корень холста */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Жест ещё пишет кадры в DOM */
  viewportLiveRef: MutableRefObject<boolean>;
  /** Идёт CSS-анимация fit/focus — куллинг ждёт её конца */
  animateTransform: boolean;
  /** Набор id, которые нельзя скрывать (мутируется на рендере) */
  cullKeepRef: MutableRefObject<Set<string>>;
  /** Отпечаток набора узлов для пересборки карты элементов */
  cullSigRef: MutableRefObject<string>;
  /** Узлы активного листа */
  nodes: Array<{ id: string }>;
  /** Порталы листов включены */
  showPortals: boolean;
  /** Смещение камеры из React */
  pan: { x: number; y: number };
  /** Масштаб из React, проценты */
  zoom: number;
  /** Ненулевые размеры узлов */
  nodeSizes: Map<string, CullNodeSize>;
  /** Одиночное выделение */
  selectedNodeId: string | null;
  /** Мультивыделение */
  selectedNodeIds: Set<string>;
  /** Подсветка из сайдбара */
  highlightNodeId?: string | null;
  /** Узел, который тащат */
  draggingNodeId: string | null;
  /** Цель drag-to-connect */
  hoveredTargetNodeId: string | null;
}

/**
 * Держит куллинг согласованным с камерой после рендера React.
 * Во время жеста и короткой CSS-анимации fit не трогает DOM.
 * @param options - Камера, размеры и id, которые остаются на экране
 */
export function useEditorCullSync({
  canvasRef,
  viewportLiveRef,
  animateTransform,
  cullKeepRef,
  cullSigRef,
  nodes,
  showPortals,
  pan,
  zoom,
  nodeSizes,
  selectedNodeId,
  selectedNodeIds,
  highlightNodeId,
  draggingNodeId,
  hoveredTargetNodeId,
}: UseEditorCullSyncOptions): void {
  const firstId = nodes[0]?.id ?? '';
  const lastId = nodes[nodes.length - 1]?.id ?? '';
  cullSigRef.current = `${nodes.length}:${firstId}:${lastId}:${showPortals ? 1 : 0}`;
  const keep = cullKeepRef.current;
  keep.clear();
  if (selectedNodeId) keep.add(selectedNodeId);
  selectedNodeIds.forEach((id) => keep.add(id));
  if (highlightNodeId) keep.add(highlightNodeId);
  if (draggingNodeId) keep.add(draggingNodeId);
  if (hoveredTargetNodeId) keep.add(hoveredTargetNodeId);

  useLayoutEffect(() => {
    if (viewportLiveRef.current || animateTransform) return;
    const root = canvasRef.current;
    if (!root) return;
    cullCanvasNodes(root, pan, zoom, nodeSizes, cullKeepRef.current, cullSigRef.current);
  }, [
    animateTransform,
    canvasRef,
    cullKeepRef,
    cullSigRef,
    draggingNodeId,
    highlightNodeId,
    hoveredTargetNodeId,
    nodeSizes,
    nodes,
    pan,
    selectedNodeId,
    selectedNodeIds,
    showPortals,
    viewportLiveRef,
    zoom,
  ]);
}
