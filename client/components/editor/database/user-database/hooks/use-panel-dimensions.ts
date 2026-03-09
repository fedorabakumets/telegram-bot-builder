/**
 * @fileoverview Хук для получения размеров панели
 * @description Отслеживает ширину и высоту контейнера панели через ResizeObserver
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Размеры панели
 */
interface PanelDimensions {
  /** Ширина панели в пикселях */
  width: number;
  /** Высота панели в пикселях */
  height: number;
}

/**
 * Хук для отслеживания размеров элемента
 * @returns Объект с размерами и ref для элемента
 */
export function usePanelDimensions(): PanelDimensions & {
  /** Ref для привязки к элементу */
  ref: React.RefObject<HTMLDivElement>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<PanelDimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ...dimensions, ref };
}
