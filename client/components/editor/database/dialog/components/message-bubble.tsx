/**
 * @fileoverview Компонент пузыря сообщения
 * Координирует отображение всех частей сообщения
 */

import { BotMessageWithMedia } from '../types';
import { UserBotData } from '@shared/schema';
import { MessageAvatar } from './message-avatar';
import { MessageMedia } from './message-media';
import { FormattedText } from './formatted-text';
import { MessageButtons } from './message-buttons';
import { ButtonClickedInfo } from './button-clicked-info';
import { MessageTimestamp } from './message-timestamp';
import {
  hasButtons,
  getButtons,
  hasButtonClicked,
  getButtonText
} from '../utils/message-utils';

/**
 * Свойства компонента сообщения
 */
interface MessageBubbleProps {
  /** Сообщение для отображения */
  message: BotMessageWithMedia;
  /** Индекс сообщения в списке */
  index: number;
  /** Данные пользователя для аватара */
  user?: UserBotData | null;
  /** Данные бота для аватара */
  bot?: UserBotData | null;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
}

/**
 * Медиа-плейсхолдеры — текст который не нужно показывать если есть медиа
 */
const MEDIA_PLACEHOLDERS = new Set(['[Фото]', '[медиа]', '[Photo]']);

/**
 * Проверяет есть ли медиа для отображения (локальное или через file_id)
 * @param message - Сообщение
 * @returns true если есть что показать
 */
function hasVisibleMedia(message: BotMessageWithMedia): boolean {
  if (Array.isArray(message.media) && message.media.length > 0) return true;
  const data = message.messageData as Record<string, unknown> | null;
  return !!(data?.photo && typeof (data.photo as any)?.file_id === 'string');
}

/**
 * Компонент отображения одного сообщения
 */
export function MessageBubble({ message, index, user, bot, projectId }: MessageBubbleProps) {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';
  const messageType: 'bot' | 'user' = isBot ? 'bot' : 'user';

  /** Скрываем текст-плейсхолдер если медиа отображается */
  const displayText = hasVisibleMedia(message) && MEDIA_PLACEHOLDERS.has(message.messageText ?? '')
    ? null
    : message.messageText;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`dialog-message-${message.messageType}-${index}`}
    >
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <MessageAvatar
          messageType={messageType}
          user={isUser ? user : null}
          bot={isBot ? bot : null}
          projectId={projectId}
        />

        <div className="flex flex-col gap-1">
          <MessageMedia
            media={message.media}
            messageData={message.messageData}
            projectId={projectId}
            tokenId={message.tokenId ?? undefined}
          />

          <FormattedText text={displayText} messageType={messageType} />

          {isBot && hasButtons(message) && (
            <MessageButtons buttons={getButtons(message)} index={index} />
          )}

          {isUser && hasButtonClicked(message) && (
            <ButtonClickedInfo buttonText={getButtonText(message)} />
          )}

          <MessageTimestamp createdAt={message.createdAt} />
        </div>
      </div>
    </div>
  );
}
