/**
 * @fileoverview Снятие will-change после жеста камеры и отложенный коммит
 * @module editor/canvas/schedule-viewport-release
 */

import { finishEditorViewportGesture, releaseEditorViewportLayer } from './paint-editor-viewport';

/**
 * Два кадра после жеста: снять запекание, затем убрать translateZ и закоммитить.
 * Пока will-change снят, а translateZ ещё стоит, браузер один раз дорисовывает резко.
 * @param getRoot - Корень холста редактора
 * @param commit - Запись итоговых pan/zoom в React
 * @returns Отмена, если жест продолжился
 */
export function scheduleViewportRelease(
  getRoot: () => HTMLElement | null,
  commit: () => void,
): () => void {
  let cancelled = false;
  let second = 0;
  const first = requestAnimationFrame(() => {
    if (cancelled) return;
    const root = getRoot();
    if (root) releaseEditorViewportLayer(root);
    second = requestAnimationFrame(() => {
      if (cancelled) return;
      const liveRoot = getRoot();
      if (liveRoot) finishEditorViewportGesture(liveRoot);
      commit();
    });
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(first);
    if (second) cancelAnimationFrame(second);
  };
}
