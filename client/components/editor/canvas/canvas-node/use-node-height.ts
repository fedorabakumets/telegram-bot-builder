/**
 * @fileoverview Хук для измерения высоты DOM-элемента
 *
 * Переиспользуемый утилитный хук, который отслеживает изменения
 * высоты элемента через ResizeObserver.
 *
 * @module canvas-node/use-node-height
 */

import { RefObject, useEffect, useState } from 'react';

/**
 * Хук для получения актуальной высоты DOM-элемента
 *
 * @param ref - Ссылка на DOM-элемент
 * @returns Текущая высота элемента в пикселях (0 до первого измерения)
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const height = useNodeHeight(ref);
 */
export function useNodeHeight(ref: RefObject<HTMLElement>): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /** Используем borderBoxSize для получения полной высоты включая padding и border */
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry.borderBoxSize?.length) {
        setHeight(entry.borderBoxSize[0].blockSize);
      } else {
        // fallback для старых браузеров
        setHeight(el.getBoundingClientRect().height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
