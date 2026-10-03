/**
 * @fileoverview Прямая отрисовка pan/zoom холста без ре-рендера React
 */

/** Смещение камеры в пикселях экрана */
export interface ViewportPan {
  /** Сдвиг по X */
  x: number;
  /** Сдвиг по Y */
  y: number;
}

/**
 * Ставит transform узлам и сдвиг сетки напрямую в DOM.
 * Вызывается на каждый кадр жеста, чтобы не прогонять дерево холста через React.
 * @param root - Корневой элемент холста редактора
 * @param pan - Смещение камеры
 * @param zoom - Масштаб в процентах
 */
export function paintEditorViewport(root: HTMLElement, pan: ViewportPan, zoom: number): void {
  const scale = zoom / 100;
  const content = root.querySelector<HTMLElement>('[data-canvas-content]');
  if (content) {
    content.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
  }
  const step = 24 * scale;
  const grid = root.querySelector<HTMLElement>('[data-canvas-grid]');
  if (!grid || step === 0) return;
  grid.style.backgroundSize = `${step}px ${step}px`;
  grid.style.transform = `translate(${pan.x % step}px, ${pan.y % step}px)`;
}
