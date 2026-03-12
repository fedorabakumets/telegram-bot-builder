/**
 * @fileoverview Обработчик завершения перетаскивания проекта
 * Сбрасывает все состояния перетаскивания
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
  setDraggedProject(null);
  setDragOverProject(null);
};
