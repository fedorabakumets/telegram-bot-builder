/** @fileoverview Расположение панели навигации, сохранённое в текущем браузере. */
import { useSyncExternalStore } from 'react';

/** Варианты привязки панели к рабочей области. */
export const sidebarPositions = [
  ['left', 'Слева'], ['right', 'Справа'], ['top', 'Сверху'], ['bottom', 'Снизу'],
] as const;

/** Сторона окна, к которой примыкает панель. */
type SidebarPosition = typeof sidebarPositions[number][0];
const key = 'botcraft-sidebar-position';
const event = 'botcraft-sidebar-position-change';
let fallback: SidebarPosition = 'left';

/** Возвращает сохранённое и допустимое положение. */
function readPosition(): SidebarPosition {
  try {
    const value = window.localStorage.getItem(key);
    return sidebarPositions.find(([position]) => position === value)?.[0] ?? 'left';
  } catch {
    return fallback;
  }
}

/**
 * Локально сохраняет положение и синхронизирует экземпляры панели.
 * @param position - Новая сторона окна.
 */
export function setSidebarPosition(position: SidebarPosition): void {
  fallback = position;
  try { window.localStorage.setItem(key, position); } catch { /* Значение живёт до перезагрузки. */ }
  window.dispatchEvent(new Event(event));
}

/**
 * Подписывается на изменения положения панели.
 * @param listener - Обработчик обновления.
 * @returns Удаление подписок.
 */
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(event, listener); window.removeEventListener('storage', listener); };
}

/** Читает позицию панели для профиля и редактора. */
export function useSidebarPosition(): SidebarPosition {
  return useSyncExternalStore(subscribe, readPosition, () => 'left');
}
