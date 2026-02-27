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
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
}

/**
 * Компонент аватара для сообщения
 */
export function MessageAvatar({ messageType, user, projectId }: MessageAvatarProps) {
  return <UserAvatar messageType={messageType} user={user} projectId={projectId} />;
}
