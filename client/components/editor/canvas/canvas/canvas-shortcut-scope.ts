/** @fileoverview Ограничение глобальных команд холста при открытии истории версий. */

/**
 * Приостанавливает команды холста, пока отдельная панель принимает ввод.
 * @param root - Документ, в котором находятся холст и порталы панелей.
 * @returns Нужно ли пропустить обработку клавиши.
 */
export function hasCanvasShortcutBlocker(root: Document): boolean {
  return root.querySelector('[data-block-canvas-shortcuts]:not([data-state="closed"])') !== null;
}
