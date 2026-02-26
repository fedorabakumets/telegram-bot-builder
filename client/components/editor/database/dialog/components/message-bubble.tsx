/**
 * @fileoverview Компонент пузыря сообщения
 * Координирует отображение всех частей сообщения
 */

import { BotMessageWithMedia } from '../types';
import { MessageAvatar } from './message-avatar';
import { MessageMedia } from './message-media';
import { MessageText } from './message-text';
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
}

/**
 * Компонент отображения одного сообщения
 */
export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';
  const messageType: 'bot' | 'user' = isBot ? 'bot' : 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`dialog-message-${message.messageType}-${index}`}
    >
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <MessageAvatar messageType={messageType} />

        <div className="flex flex-col gap-1">
          <MessageMedia media={message.media} />

          <MessageText text={message.messageText} messageType={messageType} />

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
