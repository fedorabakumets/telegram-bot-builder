/**
 * @fileoverview Типы для компонента UserDetailsPanel
 * @description Экспортирует интерфейсы и типы для панели деталей пользователя
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * Расширенное сообщение бота с дополнительными полями медиа
 */
export interface BotMessageWithMedia extends BotMessage {
  /** Массив медиафайлов, прикреплённых к сообщению */
  media?: Array<{
    /** Идентификатор медиафайла */
    id: number;
    /** URL медиафайла */
    url: string;
    /** Тип медиафайла */
    type: string;
    /** Ширина медиа */
    width?: number;
    /** Высота медиа */
    height?: number;
  }>;
}

/**
 * Интерфейс свойств компонента панели деталей пользователя
 */
export interface UserDetailsPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Данные пользователя или null */
  user: UserBotData | null;
  /** Функция закрытия панели */
  onClose: () => void;
  /** Функция открытия диалога с пользователем */
  onOpenDialog?: (user: UserBotData) => void;
  /** Функция выбора пользователя */
  onSelectUser?: (user: UserBotData) => void;
}
