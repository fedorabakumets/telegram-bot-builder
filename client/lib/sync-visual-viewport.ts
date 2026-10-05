/**
 * @fileoverview Высота страницы по видимой области экрана
 */

/**
 * Пишет высоту и сдвиг видимой области в CSS-переменные
 */
function syncVisualViewport(): void {
  const view = window.visualViewport;
  const root = document.documentElement;
  const height = view?.height ?? window.innerHeight;
  const offset = view?.offsetTop ?? 0;
  root.style.setProperty("--vv-height", `${Math.round(height)}px`);
  root.style.setProperty("--vv-offset", `${Math.round(offset)}px`);
}

/**
 * Следит за панелью браузера и клавиатурой и обновляет высоту оболочки
 */
export function installVisualViewportSync(): void {
  syncVisualViewport();
  window.visualViewport?.addEventListener("resize", syncVisualViewport);
  window.visualViewport?.addEventListener("scroll", syncVisualViewport);
  window.addEventListener("resize", syncVisualViewport);
}
