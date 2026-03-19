/**
 * @fileoverview Компонент-обертка для ProjectCard с touch-обработчиками
 * Интегрирует useProjectTouchHandlers с ProjectCard
 * @module components/editor/sidebar/components/project-card-wrapper
 */

import React from 'react';
import { BotProject } from '@shared/schema';
import { QueryClient } from '@tanstack/react-query';
import { ProjectCard, ProjectCardProps } from './project-card';
import { useProjectTouchHandlers } from '../hooks/use-project-touch-handlers';

/** Пропсы компонента ProjectCardWrapper */
export interface ProjectCardWrapperProps extends Omit<ProjectCardProps, 'onTouchStart' | 'onTouchMove' | 'onTouchEnd'> {
  /** QueryClient для обновления кеша */
  queryClient: QueryClient;
  /** Функция для сброса перетаскиваемого проекта */
  setDraggedProject: (project: BotProject | null) => void;
  /** Функция для сброса целевого проекта */
  setDragOverProject: (projectId: number | null) => void;
  /** Функция для показа уведомления */
  toast: (options: { title: string; description: string }) => void;
  /** Обработчик завершения перетаскивания проекта */
  onProjectDragEnd?: () => void;
  /** Обработчик клика по проекту для сброса drag-состояния */
  onProjectClick?: () => void;
}

/**
 * Компонент-обертка для ProjectCard с интегрированными touch-обработчиками
 * @param props - Свойства компонента
 * @returns JSX элемент карточки проекта с touch поддержкой
 */
export const ProjectCardWrapper: React.FC<ProjectCardWrapperProps> = ({
  queryClient,
  setDraggedProject,
  setDragOverProject,
  toast,
  project,
  onProjectDragEnd,
  onProjectClick,
  ...cardProps
}) => {
  // Создаём touch-обработчики для проекта
  const projectTouchHandlers = useProjectTouchHandlers({
    project,
    queryClient,
    setDraggedProject,
    setDragOverProject,
    toast,
  });

  return (
    <ProjectCard
      project={project}
      {...cardProps}
      onTouchStart={projectTouchHandlers.handleTouchStart}
      onTouchMove={projectTouchHandlers.handleTouchMove}
      onTouchEnd={projectTouchHandlers.handleTouchEnd}
      onProjectDragEnd={onProjectDragEnd}
      onProjectClick={onProjectClick}
    />
  );
};
