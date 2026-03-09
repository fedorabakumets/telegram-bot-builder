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
  /** Данные бота для avatarUrl */
  bot?: UserBotData | null;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
}

/**
 * Компонент аватара для сообщения
 */
export function MessageAvatar({ messageType, user, bot, projectId }: MessageAvatarProps) {
  // Для бота используем данные бота, для пользователя - данные пользователя
  const avatarData = messageType === 'bot' ? bot : user;
  return <UserAvatar messageType={messageType} user={avatarData} projectId={projectId} />;
}
