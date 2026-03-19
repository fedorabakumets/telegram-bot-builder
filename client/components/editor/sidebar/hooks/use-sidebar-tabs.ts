/**
 * @fileoverview Хук для управления вкладками сайдбара
 * Управляет переключением между вкладками "Элементы" и "Проекты"
 * @module components/editor/sidebar/hooks/use-sidebar-tabs
 */

import { useState, useCallback } from 'react';

/** Тип вкладки сайдбара */
export type SidebarTab = 'elements' | 'projects';

/**
 * Результат работы хука управления вкладками
 */
export interface UseSidebarTabsResult {
  /** Текущая активная вкладка */
  currentTab: SidebarTab;
  /** Переключить вкладку */
  setCurrentTab: (tab: SidebarTab) => void;
  /** Переключиться на вкладку элементов */
  showElements: () => void;
  /** Переключиться на вкладку проектов */
  showProjects: () => void;
}

/**
 * Хук для управления вкладками сайдбара
 * @returns Объект с состоянием и методами управления вкладками
 */
export function useSidebarTabs(): UseSidebarTabsResult {
  // Текущая активная вкладка
  const [currentTab, setCurrentTab] = useState<SidebarTab>('elements');

  /**
   * Переключиться на вкладку элементов
   */
  const showElements = useCallback(() => {
    setCurrentTab('elements');
  }, []);

  /**
   * Переключиться на вкладку проектов
   */
  const showProjects = useCallback(() => {
    setCurrentTab('projects');
  }, []);

  return {
    currentTab,
    setCurrentTab,
    showElements,
    showProjects
  };
}
