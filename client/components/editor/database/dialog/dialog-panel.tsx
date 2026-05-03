/**
 * @fileoverview Главная панель диалога с пользователем
 * @description Координирует все компоненты диалога, объединяет HTTP и WS сообщения
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { buildUsersApiUrl, formatUserName } from '../utils';
import { DialogPanelProps, BotMessageWithMedia } from './types';
import { useSendMessage } from './hooks/use-send-message';
import { useBotData } from './hooks/use-bot-data';
import { useDialogLiveMessages } from './hooks/use-dialog-live-messages';
import { useUserList } from '@/components/editor/database/user-details/hooks/useUserList';
import { MessageBubble } from './components/message-bubble';
import { DialogHeader } from './components/dialog-header';
import { DialogWarning } from './components/dialog-warning';
import { EmptyDialog } from './components/empty-dialog';
import { DialogInput } from './components/dialog-input';
import { LoadingMessages } from './components/loading-messages';
import { NoUserSelected } from './components/no-user-selected';
import { NodeSender } from './components/node-sender';

/**
 * Дедуплицирует и сортирует сообщения по id и времени создания.
 * HTTP-сообщения имеют приоритет над WS-дублями.
 * @param httpMessages - Сообщения из HTTP (основной источник)
 * @param liveMessages - Сообщения из WebSocket (live)
 * @returns Объединённый отсортированный массив без дублей
 */
function mergeMessages(
  httpMessages: BotMessageWithMedia[],
  liveMessages: BotMessageWithMedia[],
): BotMessageWithMedia[] {
  const httpIds = new Set(httpMessages.map((m) => m.id));
  const uniqueLive = liveMessages.filter((m) => !httpIds.has(m.id));
  const merged = [...httpMessages, ...uniqueLive];
  merged.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  return merged;
}

/**
 * Компонент панели диалога с пользователем бота.
 * Объединяет сообщения из HTTP-запроса и WebSocket (live).
 * @param props - Пропсы компонента
 * @returns JSX элемент панели диалога
 */
export function DialogPanel({
  projectId,
  selectedTokenId,
  user,
  onClose,
  onSelectUser,
}: DialogPanelProps) {
  const [showWarning, setShowWarning] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('dialog-warning-dismissed') !== 'true';
  });

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const { users } = useUserList(projectId, selectedTokenId);
  const { bot } = useBotData(projectId);

  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${user?.userId}/messages`,
    selectedTokenId
  );

  const {
    data: httpMessages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<BotMessageWithMedia[]>({
    queryKey: [requestUrl, selectedTokenId, user?.userId],
    enabled: !!user?.userId,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    staleTime: 5000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    select: (data) => {
      if (!Array.isArray(data)) {
        return data && typeof data === 'object' ? [data] : [];
      }
      return data;
    },
  });

  const { liveMessages, resetLiveMessages } = useDialogLiveMessages(
    projectId,
    selectedTokenId,
    user?.userId,
  );

  /** Объединённые и дедуплицированные сообщения */
  const messages = useMemo(
    () => mergeMessages(httpMessages, liveMessages),
    [httpMessages, liveMessages],
  );

  /** Сброс live-сообщений при смене пользователя */
  useEffect(() => {
    resetLiveMessages();
    prevMessageCountRef.current = 0;
  }, [user?.userId, resetLiveMessages]);

  /** Автопрокрутка при первой загрузке и при новых live-сообщениях */
  useEffect(() => {
    if (messagesLoading) return;
    if (messages.length === 0) return;
    if (messages.length <= prevMessageCountRef.current) return;

    prevMessageCountRef.current = messages.length;

    setTimeout(() => {
      const viewport = messagesScrollRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]',
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, [messagesLoading, messages.length]);

  const sendMessageMutation = useSendMessage(
    projectId,
    selectedTokenId,
    user?.userId ? Number(user.userId) : undefined,
    () => refetchMessages(),
  );

  if (!user) {
    return <NoUserSelected />;
  }

  const handleSelectUser = onSelectUser || (() => {});

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <DialogHeader
        user={user}
        users={users}
        formatUserName={formatUserName}
        onSelectUser={handleSelectUser}
        onClose={onClose}
      />

      {showWarning && (
        <DialogWarning
          onClose={() => {
            localStorage.setItem('dialog-warning-dismissed', 'true');
            setShowWarning(false);
          }}
        />
      )}

      <ScrollArea
        ref={messagesScrollRef}
        className="min-h-0 flex-1 p-3"
        data-testid="dialog-messages-scroll-area"
      >
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

      <NodeSender
        projectId={projectId}
        selectedTokenId={selectedTokenId}
        userId={user?.userId ? Number(user.userId) : undefined}
        onSent={refetchMessages}
      />
    </div>
  );
}
