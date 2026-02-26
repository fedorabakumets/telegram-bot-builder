/**
 * @fileoverview Компонент аватара сообщения
 * Отображает иконку бота или пользователя
 */

import { Bot, User } from 'lucide-react';

/**
 * Свойства аватара
 */
interface MessageAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
}

/**
 * Компонент аватара для сообщения
 */
export function MessageAvatar({ messageType }: MessageAvatarProps) {
  const isBot = messageType === 'bot';

  return (
    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
      }`}>
      {isBot ? (
        <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      ) : (
        <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
      )}
    </div>
  );
}
