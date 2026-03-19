/**
 * @fileoverview Хук для управления сворачиванием категорий компонентов
 * Управляет состоянием раскрытия/сворачивания категорий в палитре
 * @module components/editor/sidebar/hooks/use-sidebar-categories
 */

import { useState, useCallback } from 'react';

/**
 * Результат работы хука категорий
 */
export interface UseSidebarCategoriesResult {
  /** Множество свернутых категорий */
  collapsedCategories: Set<string>;
  /** Переключить состояние категории */
  toggleCategory: (categoryTitle: string) => void;
  /** Свернуть категорию */
  collapseCategory: (categoryTitle: string) => void;
  /** Развернуть категорию */
  expandCategory: (categoryTitle: string) => void;
  /** Проверить, свернута ли категория */
  isCollapsed: (categoryTitle: string) => boolean;
  /** Развернуть все категории */
  expandAll: () => void;
  /** Свернуть все категории */
  collapseAll: (categoryTitles: string[]) => void;
}

/**
 * Хук для управления сворачиванием категорий
 * @returns Объект с состоянием и методами управления категориями
 */
export function useSidebarCategories(): UseSidebarCategoriesResult {
  // Множество свернутых категорий
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  /**
   * Переключить состояние категории
   * @param categoryTitle - Название категории
   */
  const toggleCategory = useCallback((categoryTitle: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  }, []);

  /**
   * Свернуть категорию
   * @param categoryTitle - Название категории
   */
  const collapseCategory = useCallback((categoryTitle: string) => {
    setCollapsedCategories((prev) => new Set(prev).add(categoryTitle));
  }, []);

  /**
   * Развернуть категорию
   * @param categoryTitle - Название категории
   */
  const expandCategory = useCallback((categoryTitle: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      newSet.delete(categoryTitle);
      return newSet;
    });
  }, []);

  /**
   * Проверить, свернута ли категория
   * @param categoryTitle - Название категории
   * @returns True если категория свернута
   */
  const isCollapsed = useCallback(
    (categoryTitle: string) => {
      return collapsedCategories.has(categoryTitle);
    },
    [collapsedCategories]
  );

  /**
   * Развернуть все категории
   */
  const expandAll = useCallback(() => {
    setCollapsedCategories(new Set());
  }, []);

  /**
   * Свернуть все категории
   * @param categoryTitles - Список названий категорий
   */
  const collapseAll = useCallback((categoryTitles: string[]) => {
    setCollapsedCategories(new Set(categoryTitles));
  }, []);

  return {
    collapsedCategories,
    toggleCategory,
    collapseCategory,
    expandCategory,
    isCollapsed,
    expandAll,
    collapseAll,
  };
}
