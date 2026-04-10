/**
 * @fileoverview Хук управления фокусом и подсветкой узлов канваса
 * Управляет временной фокусировкой, постоянной подсветкой и скроллом к кнопке
 * @module pages/editor/hooks/use-node-focus
 */

import { useState, useRef, useCallback } from 'react';

/**
 * Результат работы хука фокуса узлов
 */
export interface UseNodeFocusResult {
  /** ID узла для фокусировки (сбрасывается через 100мс) */
  focusNodeId: string | null;
  /** ID узла для постоянной подсветки */
  highlightNodeId: string | null;
  /** ID кнопки для скролла в панели свойств */
  focusButtonId: string | null;
  /** Установить highlight вручную (для сброса при клике на пустое место) */
  setHighlightNodeId: (id: string | null) => void;
  /**
   * Сфокусироваться на узле канваса
   * @param nodeId - ID узла
   * @param buttonId - Опциональный ID кнопки для скролла в панели свойств
   */
  handleNodeFocus: (nodeId: string, buttonId?: string) => void;
}

/**
 * Хук для управления фокусом и подсветкой узлов канваса
 * @returns Состояния и обработчики фокуса
 */
export function useNodeFocus(): UseNodeFocusResult {
  /** ID узла для кратковременной фокусировки */
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  /** ID узла для постоянной подсветки */
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  /** ID кнопки для скролла */
  const [focusButtonId, setFocusButtonId] = useState<string | null>(null);
  /** Таймер сброса фокуса */
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Фокусируется на узле и опционально на кнопке внутри него
   * @param nodeId - ID узла для фокусировки
   * @param buttonId - Опциональный ID кнопки
   */
  const handleNodeFocus = useCallback((nodeId: string, buttonId?: string) => {
    setFocusNodeId(nodeId);
    setHighlightNodeId(nodeId);
    setFocusButtonId(buttonId ?? null);

    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => setFocusNodeId(null), 100);
    setTimeout(() => setFocusButtonId(null), 800);
  }, []);

  return {
    focusNodeId,
    highlightNodeId,
    focusButtonId,
    setHighlightNodeId,
    handleNodeFocus,
  };
}
