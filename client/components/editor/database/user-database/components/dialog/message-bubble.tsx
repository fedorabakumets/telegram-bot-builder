/**
 * @fileoverview Компонент пузыря сообщения
 * @description Отображает сообщение бота или пользователя с аватаром и контентом
 */

import { Bot, User } from 'lucide-react';
import { BotMessageWithMedia } from '../../types';
import { MessageMedia } from './message-media';
import { MessageButtons } from './message-buttons';
import { MessageTimestamp } from './message-timestamp';

/**
 * Пропсы компонента MessageBubble
 */
interface MessageBubbleProps {
  /** Сообщение */
  message: BotMessageWithMedia;
  /** Индекс сообщения */
  index: number;
}

/**
 * Компонент пузыря сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент сообщения
 */
export function MessageBubble({ message, index }: MessageBubbleProps): React.JSX.Element {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';
  const messageData = message.messageData as Record<string, any>;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.messageType}-${index}`}
    >
      <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
          }`}
        >
          {isBot ? (
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <User className="w-4 h-4 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <MessageMedia message={message} />

          <div
            className={`rounded-lg px-4 py-2 ${
              isBot
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message?.messageText ? String(message.messageText) : ''}
            </p>
          </div>

          {/* Buttons for bot messages */}
          {isBot && <MessageButtons message={message} index={index} />}

          {/* Button click info for user messages */}
          {isUser && messageData?.button_clicked && (
            <div className="mt-1">
              <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                <span>✓</span>
                <span>
                  {messageData.button_text
                    ? `Нажата: ${messageData.button_text}`
                    : 'Нажата кнопка'}
                </span>
              </div>
            </div>
          )}

          <MessageTimestamp createdAt={message.createdAt} />
        </div>
      </div>
    </div>
  );
}
