/**
 * @fileoverview Хук для управления touch-перетаскиванием проектов в sidebar
 * Интегрирует useProjectTouch с логикой переупорядочивания проектов
 * @module components/editor/sidebar/hooks/use-project-touch-handlers
 */

import { BotProject } from '@shared/schema';
import { QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useProjectTouch } from './use-project-touch';
import { apiRequest } from '@/queryClient';

/** Параметры хука useProjectTouchHandlers */
export interface UseProjectTouchHandlersParams {
  /** Проект для перетаскивания */
  project: BotProject;
  /** QueryClient для обновления кеша */
  queryClient: QueryClient;
  /** Функция для сброса перетаскиваемого проекта */
  setDraggedProject: (project: BotProject | null) => void;
  /** Функция для сброса целевого проекта */
  setDragOverProject: (projectId: number | null) => void;
  /** Функция для показа уведомления */
  toast: (options: { title: string; description: string }) => void;
  /** Колбэк начала перетаскивания проекта */
  onDragStart?: () => void;
  /** Колбэк окончания перетаскивания проекта */
  onDragEnd?: () => void;
}

/** Результат хука useProjectTouchHandlers */
export interface UseProjectTouchHandlersResult {
  /** Обработчик начала касания */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** Обработчик движения касания */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** Обработчик окончания касания */
  handleTouchEnd: (e: React.TouchEvent) => void;
  /** Флаг активного перетаскивания */
  isDragging: boolean;
}

/**
 * Хук для управления touch-перетаскиванием проектов с интеграцией переупорядочивания
 * @param params - Параметры хука
 * @returns Объект с обработчиками и состоянием
 */
export function useProjectTouchHandlers({
  project,
  queryClient,
  setDraggedProject,
  setDragOverProject,
  toast,
  onDragStart,
  onDragEnd,
}: UseProjectTouchHandlersParams): UseProjectTouchHandlersResult {
  // Реф для хранения состояния перетаскивания
  const isDraggingRef = useRef(false);
  const draggedProjectRef = useRef<BotProject | null>(null);

  /** Обработчик начала касания */
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    draggedProjectRef.current = project;
    setDraggedProject(project);
    onDragStart?.();
  }, [project, setDraggedProject, onDragStart]);

  /** Обработчик окончания касания */
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    draggedProjectRef.current = null;
    setDraggedProject(null);
    setDragOverProject(null);
    onDragEnd?.();
  }, [setDraggedProject, setDragOverProject, onDragEnd]);

  /** Обработчик движения касания с определением целевого проекта */
  const handleTouchMoveWithTarget = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !draggedProjectRef.current) return;

    const touch = e.touches[0];

    // Определяем элемент под пальцем
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = element?.closest('[data-project-id]') as HTMLElement | null;

    if (dropTarget) {
      const targetProjectId = Number(dropTarget.getAttribute('data-project-id'));
      if (targetProjectId && targetProjectId !== draggedProjectRef.current.id) {
        setDragOverProject(targetProjectId);
      } else {
        setDragOverProject(null);
      }
    } else {
      setDragOverProject(null);
    }
  }, [setDragOverProject]);

  /** Обработчик окончания касания с переупорядочиванием */
  const handleTouchEndWithReorder = useCallback(async (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !draggedProjectRef.current) {
      handleDragEnd();
      return;
    }

    const touch = e.changedTouches[0];

    // Определяем элемент под пальцем
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = element?.closest('[data-project-id]') as HTMLElement | null;

    if (dropTarget) {
      const targetProjectId = Number(dropTarget.getAttribute('data-project-id'));

      if (targetProjectId && targetProjectId !== draggedProjectRef.current.id) {
        const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
        const draggedIndex = currentProjects.findIndex(p => p.id === draggedProjectRef.current!.id);
        const targetIndex = currentProjects.findIndex(p => p.id === targetProjectId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newProjects = [...currentProjects];
          const [movedProject] = newProjects.splice(draggedIndex, 1);
          newProjects.splice(targetIndex, 0, movedProject);

          try {
            await apiRequest('PUT', '/api/projects/reorder', {
              projectIds: newProjects.map(p => p.id)
            });

            queryClient.setQueryData(['/api/projects'], newProjects);

            const newList = newProjects.map(({ data, ...rest }) => rest);
            queryClient.setQueryData(['/api/projects/list'], newList);

            toast({
              title: '✅ Проекты переупорядочены',
              description: `Проект "${draggedProjectRef.current.name}" перемещен`,
            });
          } catch (error: any) {
            console.error('❌ Ошибка сохранения порядка:', error.message);
            toast({
              title: '❌ Ошибка',
              description: 'Не удалось сохранить порядок проектов',
            });
          }
        }
      }
    }

    handleDragEnd();
  }, [queryClient, toast, handleDragEnd]);

  // Используем базовый хук useProjectTouch для визуальных эффектов
  const { handleTouchStart: baseTouchStart, handleTouchMove: baseTouchMove, handleTouchEnd: baseTouchEnd, isDragging } = useProjectTouch({
    project,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  });

  /** Комбинированный обработчик начала касания */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    baseTouchStart(e);
    handleDragStart();
  }, [baseTouchStart, handleDragStart]);

  /** Комбинированный обработчик движения касания */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    baseTouchMove(e);
    handleTouchMoveWithTarget(e);
  }, [baseTouchMove, handleTouchMoveWithTarget]);

  /** Комбинированный обработчик окончания касания */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    baseTouchEnd(e);
    handleTouchEndWithReorder(e);
  }, [baseTouchEnd, handleTouchEndWithReorder]);

  // Глобальный обработчик для предотвращения скролла во время перетаскивания
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isDragging]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
  };
}
