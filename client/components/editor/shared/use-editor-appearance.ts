/** @fileoverview Параметры оформления редактора для текущего браузера. */
import { useSyncExternalStore } from 'react';

/** Каждый параметр включён по умолчанию, его значение сохраняется отдельно. */
type AppearanceKey = 'blockLabels' | 'coloredIcons' | 'underlineTabs';
const prefix = 'botcraft-editor-appearance-';
const fallback = new Map<AppearanceKey, boolean>();

/** Читает параметр из хранилища или памяти при ограниченном доступе. */
function read(key: AppearanceKey): boolean {
  try { return window.localStorage.getItem(prefix + key) !== 'false'; }
  catch { return fallback.get(key) ?? true; }
}

/** Подписывает редактор на изменения в текущей и соседних вкладках. */
function subscribe(listener: () => void) {
  window.addEventListener(prefix, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(prefix, listener);
    window.removeEventListener('storage', listener);
  };
}

/** Возвращает текущее значение выбранного параметра оформления. */
export function useEditorAppearance(key: AppearanceKey) {
  return useSyncExternalStore(subscribe, () => read(key), () => true);
}

/** Сохраняет параметр и уведомляет открытый редактор. */
export function setEditorAppearance(key: AppearanceKey, enabled: boolean) {
  fallback.set(key, enabled);
  try { window.localStorage.setItem(prefix + key, String(enabled)); }
  catch { /* До перезагрузки настройка доступна в памяти. */ }
  window.dispatchEvent(new Event(prefix));
}
