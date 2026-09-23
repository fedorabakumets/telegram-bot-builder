/**
 * @fileoverview Отслеживание активной секции палитры при прокрутке
 * Полоска показывается только когда родной заголовок уже уехал вверх —
 * иначе дублируется с кнопкой подкатегории в списке.
 * @module components/editor/sidebar/components/use-palette-scroll-context
 */

import { useEffect, useState, type RefObject } from 'react';

/** Контекст текущей видимой секции */
export interface PaletteScrollContext {
  /** Главная категория */
  main: string;
  /** Подкатегория (пустая, если только главная) */
  sub: string;
  /** Иконка главной */
  icon: string;
  /**
   * Показывать липкую полоску.
   * false — родной заголовок ещё на экране, полоска не нужна.
   */
  visible: boolean;
}

/**
 * Находит ближайший предок с вертикальной прокруткой
 * @param el - Стартовый элемент
 * @returns Scroll-контейнер или null
 */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Верх видимой области scroll-контейнера в координатах viewport
 * @param scrollRoot - Контейнер или window
 * @returns Y верхней границы
 */
function getViewportTop(scrollRoot: HTMLElement | Window): number {
  if (scrollRoot instanceof Window) return 0;
  return scrollRoot.getBoundingClientRect().top;
}

/**
 * Следит за секциями `[data-palette-section]` и возвращает контекст для полоски.
 * @param listRef - Контейнер со списком категорий
 * @param enabled - Включён ли трекинг (выкл. при поиске)
 * @returns Текущий контекст или null
 */
export function usePaletteScrollContext(
  listRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): PaletteScrollContext | null {
  const [ctx, setCtx] = useState<PaletteScrollContext | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCtx(null);
      return;
    }

    const list = listRef.current;
    if (!list) return;

    const scrollRoot = findScrollParent(list) ?? window;

    /**
     * Вычисляет активную секцию и нужна ли полоска
     */
    const update = () => {
      const markers = list.querySelectorAll<HTMLElement>('[data-palette-section]');
      if (!markers.length) {
        setCtx(null);
        return;
      }

      const viewportTop = getViewportTop(scrollRoot);
      // Секция «под» верхом списка, когда её верх ушёл выше этой линии
      const threshold = viewportTop + 6;

      let active = markers[0];
      for (const marker of markers) {
        if (marker.getBoundingClientRect().top <= threshold) {
          active = marker;
        } else {
          break;
        }
      }

      const activeTop = active.getBoundingClientRect().top;
      // Полоска только когда заголовок секции уже скрыт над верхом скролла
      const visible = activeTop < viewportTop - 2;

      const next: PaletteScrollContext = {
        main: active.dataset.paletteMain ?? '',
        sub: active.dataset.paletteSub ?? '',
        icon: active.dataset.paletteIcon ?? '',
        visible,
      };
      setCtx((prev) => {
        if (
          prev
          && prev.main === next.main
          && prev.sub === next.sub
          && prev.icon === next.icon
          && prev.visible === next.visible
        ) {
          return prev;
        }
        return next;
      });
    };

    update();
    scrollRoot.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      scrollRoot.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [listRef, enabled]);

  return ctx;
}
