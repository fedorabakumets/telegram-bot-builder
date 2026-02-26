/**
 * @fileoverview Типы для компонента UserDetailsPanel
 * @description Экспортирует интерфейсы и типы для панели деталей пользователя
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * @typedef {Object} BotMessageWithMedia
 * @description Расширенное сообщение бота с дополнительными полями медиа
 */
export interface BotMessageWithMedia extends BotMessage {
  /** Массив медиафайлов, прикрепленных к сообщению */
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
}

/**
 * @interface UserDetailsPanelProps
 * @description Интерфейс свойств компонента панели деталей пользователя
 */
export interface UserDetailsPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Данные пользователя или null */
  user: UserBotData | null;
  /** Функция закрытия панели */
  onClose: () => void;
  /** Функция открытия диалога с пользователем */
  onOpenDialog?: (user: UserBotData) => void;
}
