/**
 * @fileoverview Типы для компонента диалоговой панели
 * Содержит расширенные типы сообщений и свойства компонентов
 */

import { BotMessage, UserBotData } from '@shared/schema';

/**
 * Расширенный тип сообщения бота с медиафайлами
 * Добавляет поддержку изображений к базовому типу BotMessage
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
  /** Данные пользователя для диалога */
  user: UserBotData | null;
  /** Колбэк закрытия панели */
  onClose: () => void;
}
