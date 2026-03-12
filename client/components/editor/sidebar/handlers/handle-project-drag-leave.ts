/**
 * @fileoverview Обработчик ухода с проекта при перетаскивании
 * Сбрасывает состояние наведения
 */
import { Dispatch, SetStateAction } from 'react';

/**
 * Обработчик события dragleave на проекте
 * @param setDragOverProject - Функция для сброса проекта над которым курсор
 */
export const handleProjectDragLeave = (
  setDragOverProject: Dispatch<SetStateAction<number | null>>
) => {
  setDragOverProject(null);
};
