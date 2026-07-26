/**
 * @fileoverview Режим отображения вкладки «Бот»: список или холст
 * @module bot/canvas/use-bot-view-mode
 */

import { useCallback, useEffect, useState } from 'react';

/** Режим вкладки «Бот» */
export type BotViewMode = 'list' | 'canvas';

/** Ключ localStorage */
const STORAGE_KEY = 'bot-tab-view-mode';

/** Событие синхронизации между экземплярами хука */
const SYNC_EVENT = 'bot-tab-view-mode-change';

/**
 * Читает сохранённый режим из localStorage
 * @returns Режим list или canvas
 */
function readStoredMode(): BotViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'canvas' || raw === 'list') return raw;
  } catch {
    /* ignore */
  }
  return 'list';
}

/**
 * Хук режима Список / Холст с синхронизацией через localStorage
 * @returns Текущий режим и сеттер
 */
export function useBotViewMode(): {
  /** Текущий режим */
  viewMode: BotViewMode;
  /** Установить режим */
  setViewMode: (mode: BotViewMode) => void;
} {
  const [viewMode, setViewModeState] = useState<BotViewMode>(readStoredMode);

  useEffect(() => {
    const onSync = () => setViewModeState(readStoredMode());
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const setViewMode = useCallback((mode: BotViewMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    setViewModeState(mode);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  return { viewMode, setViewMode };
}
