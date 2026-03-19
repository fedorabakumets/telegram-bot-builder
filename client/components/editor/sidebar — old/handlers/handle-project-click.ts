/**
 * @fileoverview Обработчик клика по проекту для сброса drag-состояния
 * Сбрасывает состояние перетаскивания при обычном клике
 * @module components/editor/sidebar/handlers/handle-project-click
 */

import { BotProject } from '@shared/schema';
import { Dispatch, SetStateAction } from 'react';

/** Параметры обработчика клика по проекту */
export interface ProjectClickParams {
  /** Текущий перетаскиваемый проект */
  draggedProject: BotProject | null;
  /** Функция для сброса перетаскиваемого проекта */
  setDraggedProject: Dispatch<SetStateAction<BotProject | null>>;
  /** Функция для сброса целевого проекта */
  setDragOverProject: Dispatch<SetStateAction<number | null>>;
}

/**
 * Обработчик клика по проекту
 * Сбрасывает drag-состояние, если проект был перетаскиваем
 * @param params - Параметры обработчика
 */
export const handleProjectClick = ({
  draggedProject,
  setDraggedProject,
  setDragOverProject,
}: ProjectClickParams) => {
  // Сбрасываем drag-состояние при клике
  if (draggedProject) {
    console.log('🏁 Сброс drag-состояния при клике');
    setDraggedProject(null);
    setDragOverProject(null);
  }
};
