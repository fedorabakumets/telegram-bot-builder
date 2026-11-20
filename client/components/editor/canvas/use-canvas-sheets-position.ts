/** @fileoverview Расположение листов редактора в текущем браузере. */
import { useSyncExternalStore } from 'react';
import { sidebarPositions } from '@/components/editor/app-sidebar/hooks/use-sidebar-position';

/** Варианты расположения листов относительно холста. */
export const canvasSheetsPositions = sidebarPositions;

/** Сторона холста для списка листов. */
export type CanvasSheetsPosition = typeof canvasSheetsPositions[number][0];

const storageKey = 'botcraft-canvas-sheets-position';
const changeEvent = 'botcraft-canvas-sheets-position-change';
let fallback: CanvasSheetsPosition = 'bottom';

/** Возвращает сохранённое положение или нижнюю панель по умолчанию. */
function readPosition(): CanvasSheetsPosition {
  try {
    const value = window.localStorage.getItem(storageKey);
    return canvasSheetsPositions.find(([position]) => position === value)?.[0] ?? 'bottom';
  } catch {
    return fallback;
  }
}

/**
 * Сохраняет положение и обновляет открытые редакторы.
 * @param position - Сторона холста для листов.
 */
export function setCanvasSheetsPosition(position: CanvasSheetsPosition): void {
  fallback = position;
  try { window.localStorage.setItem(storageKey, position); } catch { /* Значение живёт до перезагрузки. */ }
  window.dispatchEvent(new Event(changeEvent));
}

/**
 * Следит за положением листов в текущей и соседних вкладках браузера.
 * @param listener - Обработчик обновления.
 * @returns Функция отписки.
 */
function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener('storage', listener);
  };
}

/** Читает положение листов для профиля и редактора. */
export function useCanvasSheetsPosition(): CanvasSheetsPosition {
  return useSyncExternalStore(subscribe, readPosition, () => 'bottom');
}
