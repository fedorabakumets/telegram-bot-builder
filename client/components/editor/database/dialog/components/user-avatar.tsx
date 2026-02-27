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
}

/**
 * Компонент аватара для сообщения с поддержкой реальных фото
 */
export function UserAvatar({ messageType, user }: UserAvatarProps) {
  const isBot = messageType === 'bot';
  const hasPhoto = user?.avatarUrl;

  if (isBot) {
    return (
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (hasPhoto) {
    return (
      <img
        src={user.avatarUrl}
        alt="User avatar"
        className="flex-shrink-0 w-7 h-7 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
      <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
    </div>
  );
}
