/**
 * @fileoverview Хук навигации между страницами редактора
 * Инкапсулирует переходы между редактором, проектами и шаблонами
 * @module pages/editor/hooks/use-project-navigation
 */

import { useCallback } from 'react';
import { useLocation } from 'wouter';

/**
 * Результат работы хука навигации
 */
export interface UseProjectNavigationResult {
  /** Перейти на страницу шаблонов */
  handleLoadTemplate: () => void;
  /** Перейти на страницу списка проектов */
  handleGoToProjects: () => void;
  /**
   * Открыть проект в редакторе
   * @param projectId - ID проекта
   */
  handleProjectSelect: (projectId: number) => void;
}

/**
 * Хук для навигации между страницами редактора
 * @returns Обработчики навигации
 */
export function useProjectNavigation(): UseProjectNavigationResult {
  const [, setLocation] = useLocation();

  /** Перейти на страницу шаблонов */
  const handleLoadTemplate = useCallback(() => {
    setLocation('/templates');
  }, [setLocation]);

  /** Перейти на страницу списка проектов */
  const handleGoToProjects = useCallback(() => {
    setLocation('/projects');
  }, [setLocation]);

  /**
   * Открыть проект в редакторе
   * @param projectId - ID проекта для открытия
   */
  const handleProjectSelect = useCallback((projectId: number) => {
    setLocation(`/editor/${projectId}`);
  }, [setLocation]);

  return {
    handleLoadTemplate,
    handleGoToProjects,
    handleProjectSelect,
  };
}
