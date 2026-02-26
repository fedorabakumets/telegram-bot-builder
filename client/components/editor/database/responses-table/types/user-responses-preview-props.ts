/**
 * @fileoverview Тип пропсов для превью ответов пользователя
 * @description Свойства для компонента UserResponsesPreview
 */

import type { UserBotData } from '@shared/schema';

/**
 * Свойства превью ответов пользователя
 */
export interface UserResponsesPreviewProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Максимальная длина текста */
  maxLength?: number;
  /** Показывать количество ответов */
  showCount?: boolean;
}
