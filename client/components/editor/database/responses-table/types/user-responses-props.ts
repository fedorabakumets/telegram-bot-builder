/**
 * @fileoverview Тип пропсов ответов пользователя
 * @description Свойства для компонента UserResponses
 */

import type { UserBotData } from '@shared/schema';

/**
 * Свойства компонента ответов пользователя
 */
export interface UserResponsesProps {
  /** Данные пользователя */
  user: UserBotData;
}
