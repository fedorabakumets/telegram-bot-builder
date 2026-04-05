/**
 * @fileoverview Хук фокусировки на узле холста
 *
 * Управляет состояниями фокуса, подсветки узла и фокуса кнопки.
 *
 * @module UseNodeFocus
 */

import { useCallback, useRef, useState } from 'react';

/** Результат работы хука useNodeFocus */
export interface UseNodeFocusResult {
  /** ID узла для фокусировки (сбрасывается через 100мс) */
  focusNodeId: string | null;
  /** ID узла для постоянной подсветки */
  highlightNodeId: string | null;
  /** ID кнопки для скролла в панели свойств */
  focusButtonId: string | null;
  /** Установить ID подсвеченного узла */
  setHighlightNodeId: (id: string | null) => void;
  /** Обработчик фокусировки на узле */
  handleNodeFocus: (nodeId: string, buttonId?: string, persist?: boolean) => void;
}

/**
 * Хук для управления фокусом и подсветкой узлов холста.
 * Фокус сбрасывается через 100мс, подсветка держится до явного сброса.
 *
 * @returns Состояния и обработчик фокуса
 */
export function useNodeFocus(): UseNodeFocusResult {
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [focusButtonId, setFocusButtonId] = useState<string | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Фокусирует холст на указанном узле.
   *
   * @param nodeId - ID узла для фокусировки
   * @param buttonId - Опциональный ID кнопки для скролла в панели свойств
   * @param persist - Не используется (подсветка всегда держится до нового клика)
   */
  const handleNodeFocus = useCallback((nodeId: string, buttonId?: string, persist?: boolean) => {
    void persist;
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
