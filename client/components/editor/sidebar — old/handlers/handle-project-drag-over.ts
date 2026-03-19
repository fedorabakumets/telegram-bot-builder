/**
 * @fileoverview Обработчик наведения на проект при перетаскивании
 * Устанавливает целевой проект для сброса
 */
import { Dispatch, SetStateAction } from 'react';

/**
 * Обработчик события dragover на проекте
 * @param e - Событие перетаскивания
 * @param projectId - Идентификатор целевого проекта
 * @param setDragOverProject - Функция для установки проекта над которым курсор
 */
export const handleProjectDragOver = (
  e: React.DragEvent,
  projectId: number,
  setDragOverProject: Dispatch<SetStateAction<number | null>>
) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverProject(projectId);
};
