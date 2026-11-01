/** @fileoverview Прокрутка к исходному сообщению и временная подсветка с очисткой обработчиков. */
import { useLayoutEffect, useRef, type RefObject } from 'react';
import './message-target.css';

/**
 * Однократно показывает сообщение; подсветка снимается по таймеру или взаимодействию.
 * @param root - Область сообщений
 * @param messageId - Целевое сообщение
 * @param loading - Загружается ли контекст
 * @param count - Число отрисованных сообщений
 */
export function useMessageTarget(root: RefObject<HTMLDivElement>, messageId: number | null, loading: boolean, count: number) {
  const shown = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (!messageId) { shown.current = null; return; }
    if (loading || !count || shown.current === messageId) return;
    const element = root.current?.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!element) return;
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
    element.classList.add('dialog-message-target');
    shown.current = messageId;
    /** Снимает временный акцент без изменения выбранного сообщения и прокрутки. */
    const clear = () => element.classList.remove('dialog-message-target');
    const timer = window.setTimeout(clear, 3000);
    element.addEventListener('pointerdown', clear);
    element.addEventListener('keydown', clear);
    return () => {
      window.clearTimeout(timer);
      element.removeEventListener('pointerdown', clear);
      element.removeEventListener('keydown', clear);
      clear();
    };
  }, [root, messageId, loading, count]);
}
