/**
 * @fileoverview Главная панель диалога с пользователем
 * Координирует все компоненты диалога
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DialogPanelProps, BotMessageWithMedia } from './types';
import { formatUserName } from '../utils';
import { useSendMessage } from './hooks/use-send-message';
import { useBotData } from './hooks/use-bot-data';
import { useUserList } from '@/components/editor/database/user-details/hooks/useUserList';
import { MessageBubble } from './components/message-bubble';
import { DialogHeader } from './components/dialog-header';
import { DialogWarning } from './components/dialog-warning';
import { EmptyDialog } from './components/empty-dialog';
import { DialogInput } from './components/dialog-input';
import { LoadingMessages } from './components/loading-messages';
import { NoUserSelected } from './components/no-user-selected';

/**
 * Компонент панели диалога с пользователем бота
 * @param projectId - Идентификатор проекта
 * @param user - Данные пользователя для диалога
 * @param onClose - Функция закрытия панели
 * @param onSelectUser - Функция выбора пользователя
 * @returns JSX элемент панели диалога
 */
export function DialogPanel({ projectId, user, onClose, onSelectUser }: DialogPanelProps) {
  const [showWarning, setShowWarning] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('dialog-warning-dismissed') !== 'true';
  });
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const { users } = useUserList(projectId);
  const { bot } = useBotData(projectId);

  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${user?.userId}/messages`],
    enabled: !!user?.userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  /** Автопрокрутка к последнему сообщению */
  useEffect(() => {
    if (!messagesLoading && messages.length > 0 && messagesScrollRef.current) {
      setTimeout(() => {
        const viewport = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messagesLoading, messages.length, user?.userId]);

  /** Мутация отправки сообщения */
  const sendMessageMutation = useSendMessage(projectId, user?.userId ? Number(user.userId) : undefined, () => {
    refetchMessages();
  });

  if (!user) {
    return <NoUserSelected />;
  }

  const handleSelectUser = onSelectUser || (() => {});

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <DialogHeader
        user={user}
        users={users}
        formatUserName={formatUserName}
        onSelectUser={handleSelectUser}
        onClose={onClose}
      />

      {showWarning && <DialogWarning onClose={() => {
        localStorage.setItem('dialog-warning-dismissed', 'true');
        setShowWarning(false);
      }} />}

      <ScrollArea ref={messagesScrollRef} className="flex-1 p-3 min-h-0" data-testid="dialog-messages-scroll-area">
        {messagesLoading ? (
          <LoadingMessages />
        ) : messages.length === 0 ? (
          <EmptyDialog />
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                index={index}
                user={message.messageType === 'user' ? user : null}
                bot={message.messageType === 'bot' ? bot : null}
                projectId={projectId}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <DialogInput
        isPending={sendMessageMutation.isPending}
        onSend={(text) => {
          sendMessageMutation.mutate({ messageText: text });
        }}
      />
    </div>
  );
}
