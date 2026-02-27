/**
 * @fileoverview Расширенные типы сообщений с данными пользователя
 * Добавляет информацию о пользователе к сообщению
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * Сообщение с данными пользователя для отображения аватара
 */
export type BotMessageWithUser = BotMessage & {
  /** Данные пользователя для avatarUrl */
  userData?: UserBotData | null;
};
