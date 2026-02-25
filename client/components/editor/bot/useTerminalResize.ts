/**
 * @fileoverview Хук для изменения размера терминала
 *
 * Предоставляет функциональность для изменения размера терминала
 * с помощью перетаскивания.
 *
 * @module useTerminalResize
 */

import { useState, useRef } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Результат работы хука изменения размера
 */
interface UseTerminalResizeResult {
  dimensions: Dimensions;
  isResizingRef: React.RefObject<boolean>;
  startResize: (e: React.MouseEvent) => void;
}

/**
 * Хук для изменения размера терминала
 * @param initialDimensions - Начальные размеры
 * @returns Объект с размерами и обработчиками
 */
export function useTerminalResize(initialDimensions: Dimensions = { width: 600, height: 320 }): UseTerminalResizeResult {
  const [dimensions, setDimensions] = useState<Dimensions>(initialDimensions);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();

    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;

    startWidthRef.current = dimensions.width;
    startHeightRef.current = dimensions.height;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizingRef.current) return;

    const width = startWidthRef.current + (e.clientX - startXRef.current);
    const height = startHeightRef.current + (e.clientY - startYRef.current);

    // Минимальные размеры
    const minWidth = 400;
    const minHeight = 200;

    // Максимальные размеры
    const maxWidth = window.innerWidth - 50;
    const maxHeight = window.innerHeight - 50;

    setDimensions({
      width: Math.max(minWidth, Math.min(maxWidth, width)),
      height: Math.max(minHeight, Math.min(maxHeight, height))
    });
  };

  const stopResize = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  };

  return {
    dimensions,
    isResizingRef,
    startResize
  };
}
