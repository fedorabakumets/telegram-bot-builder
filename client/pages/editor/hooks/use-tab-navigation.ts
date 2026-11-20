/**
 * @fileoverview Хук навигации по вкладкам редактора
 *
 * Управляет переключением между вкладками интерфейса редактора.
 */

import { useCallback, startTransition } from 'react';
import type { EditorTab, PreviousEditorTab } from '../types';

/** Параметры хука навигации */
interface UseTabNavigationOptions {
  /** Текущая вкладка */
  currentTab: EditorTab;
  /** Функция установки текущей вкладки */
  setCurrentTab: (tab: EditorTab) => void;
  /** Функция установки предыдущей вкладки */
  setPreviousTab: (tab: PreviousEditorTab) => void;
  /** Функция открытия панели кода */
  onOpenCodePanel?: () => void;
  /** Функция закрытия панели кода */
  onCloseCodePanel?: () => void;
  /** Функция восстановления видимости canvas */
  onRestoreCanvas?: () => void;
  /** Навигация по URL */
  setLocation?: (path: string) => void;
  /** ID проекта */
  projectId?: number | null;
}

/**
 * Хук для навигации по вкладкам редактора
 *
 * @param options - Параметры навигации
 * @returns Функция переключения вкладки
 */
export function useTabNavigation({
  currentTab,
  setCurrentTab,
  setPreviousTab,
  onOpenCodePanel,
  onCloseCodePanel,
  onRestoreCanvas,
  setLocation,
  projectId
}: UseTabNavigationOptions) {
  /** Переключает интерфейс без записи данных проекта. */
  const handleTabChange = useCallback((tab: EditorTab) => {
    if (tab === currentTab) return;

    if (tab === 'preview' && projectId && setLocation) {
      setLocation(`/preview/${projectId}`);
      return;
    }

    // Сохраняем предыдущую вкладку
    if (currentTab !== 'export' && currentTab !== 'preview' && tab !== 'export') {
      setPreviousTab(currentTab);
    }

    // Для вкладки export обновляем синхронно чтобы избежать мелькания
    if (tab === 'export') {
      setCurrentTab(tab);
    } else {
      startTransition(() => {
        setCurrentTab(tab);
      });
    }

    if (tab === 'export') {
      onOpenCodePanel?.();
    } else if (currentTab === 'export' || tab === 'editor') {
      onCloseCodePanel?.();
      onRestoreCanvas?.();
    }
  }, [currentTab, setCurrentTab, setPreviousTab, onOpenCodePanel, onCloseCodePanel, onRestoreCanvas, setLocation, projectId]);

  return { handleTabChange };
}
