/**
 * @fileoverview Типы для компонента UserDatabasePanel
 * @description Экспортирует все типы, используемые в компоненте базы данных пользователей
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * BotMessage с дополнительными медиа-данными
 */
export type BotMessageWithMedia = BotMessage & {
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
};
