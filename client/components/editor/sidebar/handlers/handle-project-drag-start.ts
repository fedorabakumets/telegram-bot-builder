/**
 * @fileoverview Обработчик начала перетаскивания проекта
 * Инициализирует drag-and-drop операцию для проекта
 */
import { BotProject } from '@shared/schema';
import { Dispatch, SetStateAction } from 'react';

/** Параметры обработчика начала перетаскивания проекта */
interface ProjectDragStartParams {
  /** Проект, который перетаскивают */
  project: BotProject;
  /** Функция для установки перетаскиваемого листа */
  setDraggedSheet: Dispatch<SetStateAction<null>>;
  /** Функция для установки перетаскиваемого проекта */
  setDraggedProject: Dispatch<SetStateAction<BotProject | null>>;
}

/**
 * Обработчик события dragstart на проекте
 * @param e - Событие перетаскивания
 * @param params - Параметры обработчика
 */
export const handleProjectDragStart = (
  e: React.DragEvent,
  { project, setDraggedSheet, setDraggedProject }: ProjectDragStartParams
) => {
  e.stopPropagation();
  console.log('🎯 Начало перемещения проекта:', project.name);
  setDraggedSheet(null);
  setDraggedProject(project);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', project.id.toString());
};
