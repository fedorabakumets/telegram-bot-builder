/**
 * @fileoverview Хук навигации по вкладкам редактора
 *
 * Управляет переключением между вкладками интерфейса редактора.
 */

import { useCallback } from 'react';
import type { EditorTab, PreviousEditorTab } from '../types';

/** Параметры хука навигации */
interface UseTabNavigationOptions {
  /** Текущая вкладка */
  currentTab: EditorTab;
  /** Функция установки текущей вкладки */
  setCurrentTab: (tab: EditorTab) => void;
  /** Функция установки предыдущей вкладки */
  setPreviousTab: (tab: PreviousEditorTab) => void;
  /** Функция сохранения проекта */
  onSaveProject?: () => void;
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
  /** Функция открытия боковой панели с кодом */
  onOpenCodeSidebar?: () => void;
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
  onSaveProject,
  onOpenCodePanel,
  onCloseCodePanel,
  onRestoreCanvas,
  setLocation,
  projectId,
  onOpenCodeSidebar
}: UseTabNavigationOptions) {
  const handleTabChange = useCallback((tab: EditorTab) => {
    // Если нажали на ту же вкладку "Код" - ничего не делаем
    if (tab === 'export' && currentTab === 'export') {
      return;
    }

    // Сохраняем предыдущую вкладку
    if (currentTab !== 'export' && tab !== 'export') {
      setPreviousTab(currentTab as PreviousEditorTab);
    }

    setCurrentTab(tab);

    // Автосохранение при переключении
    if (tab === 'preview' && projectId && setLocation) {
      onSaveProject?.();
      setLocation(`/preview/${projectId}`);
      return;
    }

    if (tab === 'export') {
      if (projectId) {
        onSaveProject?.();
        onOpenCodePanel?.();
      } else {
        onOpenCodePanel?.();
      }
      // Открываем боковую панель с кодом проекта
      onOpenCodeSidebar?.();
    } else if (currentTab === 'export') {
      onCloseCodePanel?.();
      onRestoreCanvas?.();
      if (projectId) {
        onSaveProject?.();
      }
    } else if (tab === 'editor') {
      // При переключении на редактор закрываем панель кода и восстанавливаем canvas
      onCloseCodePanel?.();
      onRestoreCanvas?.();
      if (projectId) {
        onSaveProject?.();
      }
    } else if (tab === 'bot' || tab === 'users' || tab === 'user-ids') {
      if (projectId) {
        onSaveProject?.();
      }
    }
  }, [currentTab, setCurrentTab, setPreviousTab, onSaveProject, onOpenCodePanel, onCloseCodePanel, onRestoreCanvas, setLocation, projectId, onOpenCodeSidebar]);

  return { handleTabChange };
}
