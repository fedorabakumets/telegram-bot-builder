/**
 * @fileoverview Прямая отрисовка pan/zoom и запекание слоя на время жеста
 */

/** Смещение камеры в пикселях экрана */
export interface ViewportPan {
  /** Сдвиг по X */
  x: number;
  /** Сдвиг по Y */
  y: number;
}

/** Базовый шаг сетки в координатах холста, px */
const GRID_CELL = 24;
/** Минимальный шаг точки на экране: мельче точки сливаются в синюю заливку */
const MIN_GRID_SCREEN_PX = 12;

/**
 * Шаг точек сетки на экране. При сильном отдалении укрупняет клетку (×2, ×4, …),
 * чтобы точки не схлопывались в сплошной фон.
 * @param zoom - Масштаб в процентах
 * @returns Шаг в пикселях экрана
 */
export function editorGridStep(zoom: number): number {
  const scale = zoom / 100;
  if (scale <= 0) return GRID_CELL;
  let factor = 1;
  let step = GRID_CELL * scale;
  while (step < MIN_GRID_SCREEN_PX && factor < 64) {
    factor *= 2;
    step = GRID_CELL * scale * factor;
  }
  return step;
}

/**
 * Ставит transform узлам и сдвиг сетки напрямую в DOM.
 * При promote слой запекается: GPU меняет матрицу, карточки не растризуются каждый кадр.
 * @param root - Корневой элемент холста редактора
 * @param pan - Смещение камеры
 * @param zoom - Масштаб в процентах
 * @param promote - Запечь слой (will-change + translateZ) на время зума
 */
export function paintEditorViewport(
  root: HTMLElement,
  pan: ViewportPan,
  zoom: number,
  promote = false,
): void {
  const scale = zoom / 100;
  const content = root.querySelector<HTMLElement>('[data-canvas-content]');
  if (content) {
    content.style.transition = 'none';
    const boost = promote ? ' translateZ(0)' : '';
    content.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})${boost}`;
    if (promote) content.setAttribute('data-viewport-live', '');
  }
  const step = editorGridStep(zoom);
  const grid = root.querySelector<HTMLElement>('[data-canvas-grid]');
  if (!grid || step === 0) return;
  grid.style.backgroundSize = `${step}px ${step}px`;
  grid.style.transform = `translate(${pan.x % step}px, ${pan.y % step}px)`;
}

/**
 * Снимает will-change. translateZ остаётся на этот кадр, чтобы слой не уничтожился.
 * @param root - Корень холста редактора
 */
export function releaseEditorViewportLayer(root: HTMLElement): void {
  const content = root.querySelector<HTMLElement>('[data-canvas-content]');
  if (!content) return;
  content.removeAttribute('data-viewport-live');
}

/**
 * Убирает translateZ и принудительный transition:none после резкого кадра.
 * @param root - Корень холста редактора
 */
export function finishEditorViewportGesture(root: HTMLElement): void {
  const content = root.querySelector<HTMLElement>('[data-canvas-content]');
  if (!content) return;
  content.style.transform = content.style.transform.replace(/\s*translateZ\(0\)/g, '');
  content.style.transition = '';
}
