/**
 * @fileoverview Компонент аватара сообщения
 * Отображает иконку бота или пользователя с поддержкой реальных аватарок
 */

import { UserAvatar } from './user-avatar';
import { UserBotData } from '@shared/schema';

/**
 * Свойства аватара
 */
interface MessageAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя для avatarUrl */
  user?: UserBotData | null;
}

/**
 * Компонент аватара для сообщения
 */
export function MessageAvatar({ messageType, user }: MessageAvatarProps) {
  return <UserAvatar messageType={messageType} user={user} />;
}
