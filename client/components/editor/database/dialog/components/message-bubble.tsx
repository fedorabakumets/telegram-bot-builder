/**
 * @fileoverview Компонент пузыря сообщения
 * Координирует отображение всех частей сообщения с поддержкой удаления
 */

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  /** Идентификатор токена для резолва аватара */
  tokenId?: number | null;
  /** Колбэк удаления сообщения */
  onDelete?: (messageId: number) => void;
  /** Идёт ли удаление этого сообщения */
  isDeleting?: boolean;
}

/**
 * Проверяет, отправлено ли сообщение через рассылку
 * @param message - Сообщение
 * @returns true если сообщение из рассылки
 */
function isBroadcastMessage(message: BotMessageWithMedia): boolean {
  const data = message.messageData as Record<string, unknown> | null;
  return !!data?.sentFromBroadcast;
}

/** Медиа-плейсхолдеры — текст который не нужно показывать если есть медиа */
const MEDIA_PLACEHOLDERS = new Set(['[Фото]', '[медиа]', '[Photo]', '[Видео]', '[Аудио]', '[Голосовое]', '[Документ]', '[Стикер]']);

/**
 * Проверяет есть ли медиа для отображения (локальное или через file_id)
 * @param message - Сообщение
 * @returns true если есть что показать
 */
function hasVisibleMedia(message: BotMessageWithMedia): boolean {
  if (Array.isArray(message.media) && message.media.length > 0) return true;
  const data = message.messageData as Record<string, unknown> | null;
  if (!data) return false;
  return ['photo', 'video', 'audio', 'voice', 'document', 'sticker'].some(
    (type) => data[type] && typeof (data[type] as any)?.file_id === 'string'
  );
}

/**
 * Компонент отображения одного сообщения с кнопкой удаления при наведении
 * @param props - Свойства компонента
 * @returns JSX элемент сообщения
 */
export function MessageBubble({ message, index, user, bot, projectId, tokenId, onDelete, isDeleting }: MessageBubbleProps) {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';
  const messageType: 'bot' | 'user' = isBot ? 'bot' : 'user';

  /** Состояние наведения курсора на блок сообщения */
  const [isHovered, setIsHovered] = useState(false);

  /** Скрываем текст-плейсхолдер если медиа отображается */
  const displayText = hasVisibleMedia(message) && MEDIA_PLACEHOLDERS.has(message.messageText ?? '')
    ? null
    : message.messageText;

  /** Показывать ли кнопку удаления */
  const showDeleteButton = isBot && message.id > 0 && !!onDelete && (isHovered || isDeleting);

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`dialog-message-${message.messageType}-${index}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <MessageAvatar
          messageType={messageType}
          user={isUser ? user : null}
          bot={isBot ? bot : null}
          projectId={projectId}
          tokenId={tokenId ?? message.tokenId}
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

          {isBot && isBroadcastMessage(message) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              📢 Рассылка
            </span>
          )}
        </div>

        {/* Кнопка удаления — снаружи пузыря, видна при наведении */}
        {showDeleteButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(message.id)}
            disabled={isDeleting}
            title="Удалить сообщение"
          >
            {isDeleting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />
            }
          </Button>
        )}
      </div>
    </div>
  );
}
