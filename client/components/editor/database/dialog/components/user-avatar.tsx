/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию
 */

import { Bot, User } from 'lucide-react';
import { UserBotData } from '@shared/schema';
import { useState } from 'react';

/** Свойства аватара */
interface UserAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя */
  user?: UserBotData | null;
  /** ID проекта для прокси */
  projectId?: number;
  /** Размер в пикселях */
  size?: number;
}

/**
 * Компонент аватара с поддержкой реальных фото
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserAvatar({ messageType, user, projectId, size = 28 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const isBot = messageType === 'bot';
  const hasPhoto = !!user?.avatarUrl && !!projectId && !!user?.userId && !imageError;
  const iconSize = size * 0.5;

  if (isBot && hasPhoto && user?.userId) {
    return (
      <img
        src={`/api/projects/${projectId}/users/${user.userId}/avatar`}
        alt="Bot avatar"
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  if (isBot) {
    return (
      <div style={{ width: size, height: size }} className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot style={{ width: iconSize, height: iconSize }} className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (hasPhoto && user?.userId) {
    return (
      <img
        src={`/api/projects/${projectId}/users/${user.userId}/avatar`}
        alt="User avatar"
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div style={{ width: size, height: size }} className="flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
      <User style={{ width: iconSize, height: iconSize }} className="text-green-600 dark:text-green-400" />
    </div>
  );
}
