/** @fileoverview Локальный порядок и видимость инструментов холста. */
import { useSyncExternalStore } from 'react';

/** Идентификаторы и подписи инструментов в исходном порядке. */
export const canvasToolbarTitles = {
  save: 'Сохранить', search: 'Поиск узлов', undo: 'Отмена действия', redo: 'Повтор действия',
  view: 'Холст / JSON', autosave: 'Автосохранение', layout: 'Авторасстановка',
  actions: 'История действий', versions: 'История версий', marquee: 'Рамочное выделение',
  portals: 'Порталы между листами', checkpoint: 'Сохранить с заметкой',
  copy: 'Копировать в буфер', paste: 'Вставить из буфера', fit: 'Автомасштаб при смене листа',
  header: 'Шапка редактора', sidebar: 'Панель компонентов', properties: 'Панель свойств',
  help: 'Горячие клавиши',
};

/** Стабильный ключ инструмента. */
export type CanvasToolbarKey = keyof typeof canvasToolbarTitles;
const defaults = Object.keys(canvasToolbarTitles);
const key = 'botcraft-canvas-toolbar-preferences';
const event = 'botcraft-canvas-toolbar-change';
let fallback = '';

/** Возвращает сырое значение из хранилища браузера. */
function readSnapshot() {
  try { return localStorage.getItem(key) ?? ''; } catch { return fallback; }
}

/**
 * Подписывается на изменения настроек в открытых вкладках.
 * @param listener - Обработчик изменений.
 * @returns Функция отписки.
 */
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Отбрасывает неизвестные и повторяющиеся ключи.
 * @param value - Сохранённое значение списка.
 * @returns Допустимые ключи инструментов.
 */
function readKeys(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(id => defaults.includes(id)))] : [];
}

/** Возвращает текущий порядок и список скрытых инструментов. */
export function useCanvasToolbarPreferences() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => '');
  let saved: { /** Порядок с диска. */ order?: unknown; /** Скрытые инструменты с диска. */ hidden?: unknown } | null = null;
  try { saved = JSON.parse(raw); } catch { /* Используем исходный порядок. */ }
  const order = readKeys(saved?.order);
  return { order: [...order, ...defaults.filter(id => !order.includes(id))], hidden: readKeys(saved?.hidden) };
}

/**
 * Сохраняет настройки или восстанавливает исходные значения.
 * @param preferences - Порядок и скрытые элементы или отсутствие значения для сброса.
 */
export function setCanvasToolbarPreferences(preferences?: ReturnType<typeof useCanvasToolbarPreferences>) {
  fallback = preferences ? JSON.stringify(preferences) : '';
  try { localStorage.setItem(key, fallback); } catch { /* Сохраняем в памяти вкладки. */ }
  window.dispatchEvent(new Event(event));
}
