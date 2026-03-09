/**
 * @fileoverview Компонент области сообщений
 * @description ScrollArea с историей сообщений диалога
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw } from 'lucide-react';
import { BotMessageWithMedia } from '../../types';
import { MessageBubble } from './message-bubble';
import { EmptyMessages } from './empty-messages';

/**
 * Пропсы компонента MessagesArea
 */
interface MessagesAreaProps {
  /** Ссылка на элемент прокрутки */
  messagesScrollRef: React.RefObject<HTMLDivElement>;
  /** Флаг загрузки сообщений */
  isLoading: boolean;
  /** Список сообщений */
  messages: BotMessageWithMedia[];
}

/**
 * Компонент области сообщений
 * @param props - Пропсы компонента
 * @returns JSX компонент области сообщений
 */
export function MessagesArea({
  messagesScrollRef,
  isLoading,
  messages,
}: MessagesAreaProps): React.JSX.Element {
  return (
    <ScrollArea ref={messagesScrollRef} className="h-[400px] pr-4" data-testid="messages-scroll-area">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка сообщений...</span>
        </div>
      ) : messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              index={index}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
