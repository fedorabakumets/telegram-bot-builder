/**
 * @fileoverview Типы для компонента диалоговой панели
 * @description Содержит расширенные типы сообщений и свойства компонентов
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * Расширенный тип сообщения бота с медиафайлами
 */
export type BotMessageWithMedia = BotMessage & {
  /** Медиафайлы сообщения */
  media?: Array<{
    /** Идентификатор медиафайла */
    id: number;
    /** URL медиафайла */
    url: string;
    /** Тип медиафайла */
    type: string;
    /** Ширина изображения */
    width?: number;
    /** Высота изображения */
    height?: number;
  }>;
};

/**
 * Свойства компонента панели диалога
 */
export interface DialogPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Данные пользователя для диалога */
  user: UserBotData | null;
  /** Колбэк закрытия панели */
  onClose: () => void;
  /** Функция выбора пользователя */
  onSelectUser?: (user: UserBotData) => void;
}
