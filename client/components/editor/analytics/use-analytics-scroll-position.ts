/** @fileoverview Сохранение позиции аналитики с восстановлением после загрузки графиков и списков. */
import { useEffect, useRef } from 'react';
/** Запоминает прокрутку отдельно для проекта и выбранного бота. */
export function useAnalyticsScrollPosition(projectId: number, tokenId?: number | null) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = root.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    const key = `analytics:scroll:${projectId}:${tokenId ?? 'all'}`;
    let target = 0;
    try { const saved = Number(localStorage.getItem(key)); if (Number.isFinite(saved) && saved > 0) target = saved; } catch { /* Ограничение хранилища не мешает прокрутке. */ }
    let restoring = target > 0;
    /** Записывает только пользовательскую позицию, не промежуточную высоту загрузки. */
    const save = () => { if (!restoring) try { localStorage.setItem(key, String(viewport.scrollTop)); } catch { /* Хранилище может быть недоступно. */ } };
    /** Возвращает сохранённую позицию по мере появления содержимого. */
    const restore = () => {
      if (!restoring) return;
      viewport.scrollTop = target;
      // Высота может снова уменьшиться при загрузке рекламной таблицы; ждём реального действия пользователя.
    };
    /** Ручное действие отменяет ожидание восстановления и сохраняет новый выбор пользователя. */
    const interact = () => { restoring = false; observer.disconnect(); };
    const observer = new ResizeObserver(restore);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    restore();
    viewport.addEventListener('scroll', save, { passive: true });
    viewport.addEventListener('wheel', interact, { passive: true });
    viewport.addEventListener('pointerdown', interact);
    viewport.addEventListener('keydown', interact);
    window.addEventListener('pagehide', save);
    return () => {
      save(); observer.disconnect();
      viewport.removeEventListener('scroll', save); viewport.removeEventListener('wheel', interact);
      viewport.removeEventListener('pointerdown', interact); viewport.removeEventListener('keydown', interact);
      window.removeEventListener('pagehide', save);
    };
  }, [projectId, tokenId]);
  return root;
}
