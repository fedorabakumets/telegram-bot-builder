/**
 * @fileoverview Общий стиль SVG-слоя линий на холсте
 */

import type { CSSProperties } from 'react';

/**
 * Слой линий 1×1 с overflow: visible.
 * Бокс 20000×20000 не влезает в текстуру видеокарты, и панорамирование
 * холста начинает заново растеризоваться на каждом кадре.
 * @param zIndex - Порядок слоя среди узлов
 * @returns Inline-стили SVG
 */
export function connectionSvgStyle(zIndex: number): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex,
  };
}
