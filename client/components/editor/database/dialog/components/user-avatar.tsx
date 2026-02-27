/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию
 */

import { Bot, User } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Свойства аватара
 */
interface UserAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя для получения avatarUrl */
  user?: UserBotData | null;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
}

/**
 * Компонент аватара для сообщения с поддержкой реальных фото
 */
export function UserAvatar({ messageType, user, projectId }: UserAvatarProps) {
  const isBot = messageType === 'bot';
  const hasPhoto = user?.avatarUrl && projectId;

  // Для бота с аватаркой показываем фото
  if (isBot && hasPhoto && user?.userId) {
    // Для бота используем его ID как userId для прокси
    const avatarUrl = `/api/projects/${projectId}/users/${user.userId}/avatar`;

    return (
      <img
        src={avatarUrl}
        alt="Bot avatar"
        className="flex-shrink-0 w-7 h-7 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Для бота без аватарки показываем иконку
  if (isBot) {
    return (
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  // Для пользователя с аватаркой показываем фото
  if (hasPhoto && user?.userId) {
    const avatarUrl = `/api/projects/${projectId}/users/${user.userId}/avatar`;

    return (
      <img
        src={avatarUrl}
        alt="User avatar"
        className="flex-shrink-0 w-7 h-7 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Для пользователя без аватарки показываем иконку
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
      <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
    </div>
  );
}
