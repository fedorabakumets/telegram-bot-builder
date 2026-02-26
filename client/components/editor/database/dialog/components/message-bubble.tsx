/**
 * @fileoverview Компонент пузыря сообщения
 * Отображает сообщение с медиа, кнопками и временем
 */

import { Bot, User } from 'lucide-react';
import { BotMessageWithMedia } from '../types';
import { formatDate } from '../utils/format-date';

/**
 * Свойства компонента сообщения
 */
interface MessageBubbleProps {
  /** Сообщение для отображения */
  message: BotMessageWithMedia;
  /** Индекс сообщения в списке */
  index: number;
}

/**
 * Компонент отображения одного сообщения
 */
export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`dialog-message-${message.messageType}-${index}`}
    >
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
          }`}>
          {isBot ? (
            <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {/* Media files */}
          {message.media && Array.isArray(message.media) && message.media.length > 0 && (
            <div className="rounded-lg overflow-hidden max-w-[200px] space-y-1">
              {message.media.map((m, idx) => (
                <img
                  key={idx}
                  src={m.url}
                  alt="Photo"
                  className="w-full h-auto rounded-lg"
                  data-testid={`dialog-photo-${message.id}-${idx}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {/* Text */}
          <div className={`rounded-lg px-3 py-2 ${
              isBot
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
            }`}>
            <p className="text-sm whitespace-pre-wrap break-words">
              {message?.messageText ? String(message.messageText) : ''}
            </p>
          </div>

          {/* Buttons for bot messages */}
          {isBot && hasButtons(message) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {getButtons(message).map((button, btnIndex) => (
                <div
                  key={btnIndex}
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  data-testid={`dialog-button-preview-${index}-${btnIndex}`}
                >
                  {String(button?.text ?? '')}
                </div>
              ))}
            </div>
          )}

          {/* Button clicked info for user messages */}
          {isUser && hasButtonClicked(message) && (
            <div className="mt-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                <span>{getButtonText(message) ?? 'Нажата кнопка'}</span>
              </div>
            </div>
          )}

          {/* Timestamp */}
          {message.createdAt && (
            <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Проверка наличия кнопок в сообщении
 */
function hasButtons(message: BotMessageWithMedia): boolean {
  return !!(
    message.messageData &&
    typeof message.messageData === 'object' &&
    'buttons' in message.messageData &&
    Array.isArray((message.messageData as Record<string, any>).buttons) &&
    ((message.messageData as Record<string, any>).buttons as Array<any>).length > 0
  );
}

/**
 * Получение кнопок из сообщения
 */
function getButtons(message: BotMessageWithMedia): Array<any> {
  return Array.isArray((message.messageData as any)?.buttons)
    ? (message.messageData as any).buttons
    : [];
}

/**
 * Проверка нажатия кнопки пользователем
 */
function hasButtonClicked(message: BotMessageWithMedia): boolean {
  return !!(
    message.messageData &&
    typeof message.messageData === 'object' &&
    'button_clicked' in message.messageData &&
    message.messageData.button_clicked
  );
}

/**
 * Получение текста нажатой кнопки
 */
function getButtonText(message: BotMessageWithMedia): string | null {
  if (!message.messageData || typeof message.messageData !== 'object') return null;
  const data = message.messageData as Record<string, any>;
  return data.button_text ? `Нажата: ${data.button_text}` : null;
}
