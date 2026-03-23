/**
 * @fileoverview Обработчик ухода мыши из контейнера проектов
 * Сбрасывает эффект drag-over при уходе из области
 * @module components/editor/sidebar/handlers/handle-container-drag-leave
 */

import { Dispatch, SetStateAction } from 'react';

/**
 * Обработчик ухода мыши из контейнера проектов
 * @param setDragOverProject - Функция для сброса целевого проекта
 * @param setDragOverSheet - Функция для сброса целевого листа
 */
export const handleContainerDragLeave = (
  setDragOverProject: Dispatch<SetStateAction<number | null>>,
  setDragOverSheet: Dispatch<SetStateAction<string | null>>
) => {
  setDragOverProject(null);
  setDragOverSheet(null);
};
