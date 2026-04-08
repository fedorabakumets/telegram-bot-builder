/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию
 */

import { Bot, User } from 'lucide-react';
import { UserBotData } from '@shared/schema';
import { useState, useEffect } from 'react';

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
  /** Размер аватара в пикселях (по умолчанию 28) */
  size?: number;
}

/**
 * Компонент аватара для сообщения с поддержкой реальных фото
 */
export function UserAvatar({ messageType, user, projectId, size = 28 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const isBot = messageType === 'bot';

  // Сбрасываем ошибку при смене URL аватарки
  const avatarKey = `${projectId}-${user?.userId}-${user?.avatarUrl}`;
  useEffect(() => {
    setImageError(false);
  }, [avatarKey]);

  const hasPhoto = !!user?.avatarUrl && !!projectId && !!user?.userId && !imageError;

  console.log('[UserAvatar]', { messageType, userId: user?.userId, avatarUrl: user?.avatarUrl, projectId, hasPhoto, imageError });

  // Вычисляем размер иконки для fallback
  const iconSize = size * 0.5;

  // Для бота с аватаркой показываем фото
  if (isBot && hasPhoto && user?.userId) {
    // Для бота используем его ID как userId для прокси
    const avatarUrl = `/api/projects/${projectId}/users/${user.userId}/avatar`;

    return (
      <img
        src={avatarUrl}
        alt="Bot avatar"
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Для бота без аватарки показываем иконку
  if (isBot) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
      >
        <Bot style={{ width: iconSize, height: iconSize }} className="text-blue-600 dark:text-blue-400" />
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
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Для пользователя без аватарки показываем иконку
  return (
    <div
      style={{ width: size, height: size }}
      className="flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
    >
      <User style={{ width: iconSize, height: iconSize }} className="text-green-600 dark:text-green-400" />
    </div>
  );
}
