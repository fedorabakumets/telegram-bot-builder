/** @fileoverview Локальные предпочтения видимости и размещения элементов шапок. */
import { useSyncExternalStore } from 'react';
import { useSearch } from 'wouter';

/** Вкладки, использующие общий каркас шапки. */
export const workspaceTabs = [
  ['editor', 'Редактор'], ['bot', 'Боты'], ['terminal', 'Терминал'], ['users', 'Пользователи'],
  ['dialogs', 'Диалоги'], ['analytics', 'Аналитика'], ['tables', 'Таблицы'], ['files', 'Файлы'],
  ['versions', 'История версий'], ['export', 'Код проекта'], ['agent', 'Агент'],
] as const;

/** Ключ вкладки в адресной строке. */
export type WorkspaceTabKey = typeof workspaceTabs[number][0];

/** Настройки одной вкладки. */
export interface WorkspaceHeaderPreferences {
  /** Показывать иконку рядом с названием. */
  showIcon: boolean;
  /** Принудительно размещать селекторы в отдельной строке. */
  selectorsBelow: boolean;
  /** Принудительно размещать кнопки в отдельной строке. */
  actionsBelow: boolean;
  /** Порядок кнопок шапки по стабильным ключам. */
  actionOrder: string[];
  /** Ключи скрытых кнопок. */
  hiddenActions: string[];
  /** Порядок селекторов проекта и бота. */
  selectorOrder: string[];
  /** Ключи скрытых селекторов. */
  hiddenSelectors: string[];
}

/** Определяет текущую вкладку рабочего пространства из адреса. */
export function useCurrentWorkspaceTab(): WorkspaceTabKey {
  const requested = new URLSearchParams(useSearch()).get('tab');
  return workspaceTabs.find(([id]) => id === requested)?.[0] ?? 'editor';
}

/** Возвращает только уникальные строковые ключи из сохранённых данных. */
function readActionKeys(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];
}

const key = 'botcraft-workspace-header-preferences';
const event = 'botcraft-workspace-header-preferences-change';
let fallback = '';

/** Возвращает снимок для подписки и начального рендера. */
function readSnapshot(): string {
  try { return window.localStorage.getItem(key) ?? ''; } catch { return fallback; }
}

/**
 * Подписывается на изменения текущего и других окон браузера.
 * @param listener - Обработчик изменения.
 * @returns Удаление обработчиков.
 */
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(event, listener); window.removeEventListener('storage', listener); };
}

/** Читает только объект настроек и игнорирует повреждённые записи. */
function parseSnapshot(raw: string): Partial<Record<WorkspaceTabKey, WorkspaceHeaderPreferences & {
  /** Флаг старой версии для переноса скрытия группы. */
  showSelectors?: boolean;
}>> {
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  } catch {
    /** Пустое хранилище означает исходную компоновку. */
  }
  return {};
}

/**
 * Читает сохранённые параметры выбранной вкладки.
 * @param tab - Ключ выбранной вкладки.
 * @returns Проверенные параметры со стандартными значениями для отсутствующих полей.
 */
export function useWorkspaceHeaderPreferences(tab: WorkspaceTabKey): WorkspaceHeaderPreferences {
  const saved = parseSnapshot(useSyncExternalStore(subscribe, readSnapshot, () => ''))[tab];
  return {
    showIcon: saved?.showIcon !== false,
    selectorsBelow: saved?.selectorsBelow === true, actionsBelow: saved?.actionsBelow === true,
    actionOrder: readActionKeys(saved?.actionOrder), hiddenActions: readActionKeys(saved?.hiddenActions),
    selectorOrder: readActionKeys(saved?.selectorOrder),
    /** Старое скрытие группы переносится на оба селектора. */
    hiddenSelectors: saved?.hiddenSelectors === undefined && saved?.showSelectors === false
      ? ['project', 'bot'] : readActionKeys(saved?.hiddenSelectors),
  };
}

/**
 * Сохраняет параметры или сбрасывает их для одной вкладки.
 * @param tab - Ключ вкладки.
 * @param preferences - Новые параметры или отсутствие параметров для сброса.
 */
export function setWorkspaceHeaderPreferences(tab: WorkspaceTabKey, preferences?: WorkspaceHeaderPreferences): void {
  const snapshot = parseSnapshot(readSnapshot());
  if (preferences) snapshot[tab] = preferences;
  else delete snapshot[tab];
  fallback = JSON.stringify(snapshot);
  try { window.localStorage.setItem(key, fallback); } catch { /* Доступно до перезагрузки. */ }
  window.dispatchEvent(new Event(event));
}
