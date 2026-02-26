/**
 * @fileoverview Тип пропсов для списка ответов пользователя
 * @description Свойства для компонента UserResponsesList
 */

import type { VariableToQuestionMap } from '../../user-database/types';

/**
 * Свойства списка ответов пользователя
 */
export interface UserResponsesListProps {
  /** Данные ответов пользователя */
  userData: Record<string, unknown> | unknown;
  /** Карта вопросов */
  variableToQuestionMap: VariableToQuestionMap;
  /** Функция поиска URL фото */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}
