/**
 * @fileoverview Лента сообщений чата поддержки с автопрокруткой вниз
 * @module components/support/support-message-list
 */

import { useEffect, useRef } from 'react';
import type { SupportMessageDto, SupportSender } from '@shared/support/support.types';
import { cn } from '@/utils/utils';
import { SupportAttachmentImage } from './support-attachment-image';

/** Пропсы ленты сообщений */
interface SupportMessageListProps {
  /** Сообщения по возрастанию времени */
  messages: SupportMessageDto[];
  /** Чьими глазами смотрим: свои сообщения справа */
  viewer: SupportSender;
  /** Текст, когда сообщений нет */
  emptyText: string;
  /** Показывать ли контекст отправки под сообщением пользователя */
  showContext?: boolean;
  /** Свои сообщения уже прочитаны собеседником */
  ownRead?: boolean;
  /** Начало адреса картинки: /api/support/attachments или /admin/api/support/attachments */
  attachmentBase: string;
}

/**
 * Форматирует время сообщения
 * @param iso - Дата в ISO
 * @returns Строка вида «30.09, 13:51»
 */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Лента сообщений: свои справа синим, чужие слева серым
 * @param props - Свойства компонента
 * @returns JSX элемент ленты
 */
export function SupportMessageList({
  messages,
  viewer,
  emptyText,
  showContext,
  ownRead = false,
  attachmentBase,
}: SupportMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastOwnId = [...messages].reverse().find((message) => message.sender === viewer)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => {
        const own = message.sender === viewer;
        const context = showContext && message.sender === 'user' ? message.context : null;
        return (
          <div key={message.id} className={cn('flex flex-col', own ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
                own
                  ? 'rounded-br-sm bg-blue-600 text-white'
                  : 'rounded-bl-sm bg-muted text-foreground',
              )}
            >
              {message.text ? message.text : null}
              {(message.attachments ?? []).map((attachment) => (
                <SupportAttachmentImage
                  key={attachment.id}
                  src={`${attachmentBase}/${attachment.id}`}
                  alt={attachment.fileName}
                  className={message.text ? 'mt-2' : undefined}
                />
              ))}
            </div>
            <span className="mt-1 px-1 text-[11px] text-muted-foreground">
              {formatTime(message.createdAt)}
              {message.source === 'telegram' && ' · из Telegram'}
              {ownRead && message.id === lastOwnId && ' · Прочитано'}
            </span>
            {context && (
              <span className="px-1 text-[11px] text-muted-foreground/80">
                {[context.projectId && `проект #${context.projectId}`, context.path]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
