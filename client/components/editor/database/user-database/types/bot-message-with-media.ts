/**
 * @fileoverview Тип сообщения бота с медиа-данными
 * @description Расширяет BotMessage дополнительными медиа-полями
 */

import { BotMessage } from '@shared/schema';

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
