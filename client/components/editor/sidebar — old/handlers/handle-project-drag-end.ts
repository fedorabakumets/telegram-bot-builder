/**
 * @fileoverview Обработчик завершения перетаскивания проекта
 * Сбрасывает состояние перетаскиваемого проекта
 * @module components/editor/sidebar/handlers/handle-project-drag-end
 */

import { Dispatch, SetStateAction } from 'react';

/**
 * Обработчик события dragend на проекте
 * @param setDraggedProject - Функция для сброса перетаскиваемого проекта
 * @param setDragOverProject - Функция для сброса целевого проекта
 */
export const handleProjectDragEnd = (
  setDraggedProject: Dispatch<SetStateAction<any>>,
  setDragOverProject: Dispatch<SetStateAction<number | null>>
) => {
  console.log('🏁 Завершение перетаскивания проекта');
  setDraggedProject(null);
  setDragOverProject(null);
};
