/**
 * @fileoverview Утилиты синхронизации query-параметров URL редактора
 * @module pages/editor/utils/editor-url-params
 */

/** Имя query-параметра активного листа */
export const EDITOR_SHEET_PARAM = 'sheet';

/** Имя query-параметра выбранного узла канваса */
export const EDITOR_NODE_PARAM = 'node';

/** Имя query-параметра кнопки внутри выбранного узла */
export const EDITOR_BUTTON_PARAM = 'button';

/**
 * Опции синхронизации query-параметров редактора
 */
export interface SyncEditorUrlParamsOptions {
  /** Текущая вкладка редактора (?tab=, опускается для вкладки editor) */
  tab?: string;
  /** ID выбранного токена бота (?bot=) */
  bot?: number | null;
  /** ID активного листа (?sheet=) */
  sheet?: string | null;
  /** ID выбранного узла канваса (?node=) */
  node?: string | null;
  /** ID кнопки внутри выбранного узла (?button=) */
  button?: string | null;
}

/**
 * Читает ID листа из query-параметра ?sheet=
 * @returns ID листа или null, если параметр отсутствует
 */
export function getSheetIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(EDITOR_SHEET_PARAM);
}

/**
 * Читает ID узла из query-параметра ?node=
 * @returns ID узла или null, если параметр отсутствует
 */
export function getNodeIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(EDITOR_NODE_PARAM);
}

/**
 * Читает ID кнопки из query-параметра ?button=
 * @returns ID кнопки или null, если параметр отсутствует
 */
export function getButtonIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(EDITOR_BUTTON_PARAM);
}

/**
 * Обновляет query-параметры URL редактора через replaceState.
 * Не затрагивает параметры, для которых значение не передано (undefined).
 * @param options - Значения параметров для синхронизации
 */
export function syncEditorUrlParams(options: SyncEditorUrlParamsOptions): void {
  const url = new URL(window.location.href);

  if (options.tab !== undefined) {
    if (options.tab === 'editor') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', options.tab);
    }
  }

  if (options.bot !== undefined) {
    if (options.bot) {
      url.searchParams.set('bot', String(options.bot));
    } else {
      url.searchParams.delete('bot');
    }
  }

  if (options.sheet !== undefined) {
    if (options.sheet) {
      url.searchParams.set(EDITOR_SHEET_PARAM, options.sheet);
    } else {
      url.searchParams.delete(EDITOR_SHEET_PARAM);
    }
  }

  if (options.node !== undefined) {
    if (options.node) {
      url.searchParams.set(EDITOR_NODE_PARAM, options.node);
    } else {
      url.searchParams.delete(EDITOR_NODE_PARAM);
      url.searchParams.delete(EDITOR_BUTTON_PARAM);
    }
  }

  if (options.button !== undefined) {
    if (options.button) {
      url.searchParams.set(EDITOR_BUTTON_PARAM, options.button);
    } else {
      url.searchParams.delete(EDITOR_BUTTON_PARAM);
    }
  }

  window.history.replaceState(null, '', url.toString());
}
