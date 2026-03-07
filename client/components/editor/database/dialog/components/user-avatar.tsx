/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию
 */

import { Bot, User } from 'lucide-react';
import { UserBotData } from '@shared/schema';
import { useState } from 'react';

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
  const [imageError, setImageError] = useState(false);
  const isBot = messageType === 'bot';
  const hasPhoto = !!user?.avatarUrl && !!projectId && !!user?.userId && !imageError;

  // Для бота с аватаркой показываем фото
  if (isBot && hasPhoto && user?.userId) {
    // Для бота используем его ID как userId для прокси
    const avatarUrl = `/api/projects/${projectId}/users/${user.userId}/avatar`;

    return (
      <img
        src={avatarUrl}
        alt="Bot avatar"
        className="w-full h-full flex-shrink-0 rounded-full object-cover"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Для бота без аватарки показываем иконку
  if (isBot) {
    return (
      <div className="w-full h-full flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot className="w-1/2 h-1/2 text-blue-600 dark:text-blue-400" />
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
        className="w-full h-full flex-shrink-0 rounded-full object-cover"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Для пользователя без аватарки показываем иконку
  return (
    <div className="w-full h-full flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
      <User className="w-1/2 h-1/2 text-green-600 dark:text-green-400" />
    </div>
  );
}
