/** @fileoverview Параметры оформления редактора для текущего браузера. */
import { useSyncExternalStore } from 'react';

/** Ключи независимо сохраняемых параметров оформления. */
type AppearanceKey = 'blockLabels' | 'coloredIcons' | 'underlineTabs' | 'miniVisible' | `miniTab-${string}`;
const prefix = 'botcraft-editor-appearance-';
const fallback = new Map<AppearanceKey, boolean>();

/** Читает параметр из хранилища или памяти при ограниченном доступе. */
function read(key: AppearanceKey): boolean {
  const defaultValue = key !== 'miniTab-editor';
  try {
    const value = window.localStorage.getItem(prefix + key);
    return value === null ? defaultValue : value !== 'false';
  } catch { return fallback.get(key) ?? defaultValue; }
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
  return useSyncExternalStore(subscribe, () => read(key), () => key !== 'miniTab-editor');
}

/** Проверяет, включены ли все выбранные параметры оформления. */
export function useAllEditorAppearance(keys: readonly AppearanceKey[]) {
  return useSyncExternalStore(subscribe, () => keys.every(read), () => !keys.includes('miniTab-editor'));
}

/** Сохраняет параметр и уведомляет открытый редактор. */
export function setEditorAppearance(key: AppearanceKey, enabled: boolean) {
  fallback.set(key, enabled);
  try { window.localStorage.setItem(prefix + key, String(enabled)); }
  catch { /* До перезагрузки настройка доступна в памяти. */ }
  window.dispatchEvent(new Event(prefix));
}

/** Возвращает оформление листов с учётом настроек профиля. */
export function useSheetAppearance() {
  const underline = useEditorAppearance('underlineTabs');
  const colored = useEditorAppearance('coloredIcons');
  return {
    active: underline ? 'text-foreground' : 'bg-blue-600 text-white',
    name: underline ? 'underline decoration-2 underline-offset-4' : '',
    icon: colored ? 'text-blue-500 dark:text-blue-400' : 'text-current',
  };
}
