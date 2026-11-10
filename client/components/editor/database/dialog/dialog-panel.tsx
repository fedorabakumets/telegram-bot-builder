/**
 * @fileoverview Главная панель диалога с пользователем
 * @description Координирует все компоненты диалога, объединяет HTTP и WS сообщения.
 * Поддерживает как личные диалоги, так и групповые чаты.
 */

import { useMessageTarget } from './hooks/use-message-target';
import { readFileMessageId } from './utils/file-message-target';
import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Radio } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { buildUsersApiUrl, formatUserName } from '../utils';
import { DialogPanelProps, BotMessageWithMedia } from './types';
import { useSendMessage } from './hooks/use-send-message';
import { useSendGroupMessage } from './hooks/use-send-group-message';
import { useDeleteMessage } from './hooks/use-delete-message';
import { useEditMessage } from './hooks/use-edit-message';
import { useBotData } from './hooks/use-bot-data';
import { useProjectData } from './hooks/use-project-data';
import { collectNodesFromProjectData } from './utils/node-utils';
import { useDialogLiveMessages } from './hooks/use-dialog-live-messages';
import { useOlderDialogMessages } from './hooks/use-older-dialog-messages';
import { useUserList } from '@/components/editor/database/user-details/hooks/useUserList';
import { MessageBubble } from './components/message-bubble';
import { MessageNavigation } from './components/message-navigation';
import { DialogHeader } from './components/dialog-header';
import { EmptyDialog } from './components/empty-dialog';
import { DialogInput } from './components/dialog-input';
import { LoadingMessages } from './components/loading-messages';
import { NoUserSelected } from './components/no-user-selected';
import { NodeSender } from './components/node-sender';
import { canActOnDialogMessage } from './utils/dialog-message-source';

/**
 * Дедуплицирует и сортирует сообщения по id и времени создания.
 * HTTP-сообщения имеют приоритет над WS-дублями.
 * Оптимистичные сообщения (id < 0) отбрасываются если HTTP уже вернул данные.
 * @param httpMessages - Сообщения из HTTP (основной источник)
 * @param liveMessages - Сообщения из WebSocket (live) и оптимистичные
 * @returns Объединённый отсортированный массив без дублей
 */
function mergeMessages(
  httpMessages: BotMessageWithMedia[],
  liveMessages: BotMessageWithMedia[],
): BotMessageWithMedia[] {
  const httpIds = new Set(httpMessages.map((m) => m.id));
  const uniqueLive = liveMessages.filter((m) => {
    // Оптимистичные сообщения (id < 0) показываем только пока HTTP ещё не вернул данные
    if (m.id < 0) return httpMessages.length === 0;
    // WS-дубли реальных сообщений — пропускаем
    return !httpIds.has(m.id);
  });
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
 * Для групп загружает сообщения через /groups/:groupId/messages и отправляет через send-group-message.
 * @param props - Пропсы компонента
 * @returns JSX элемент панели диалога
 */
export function DialogPanel({
  projectId,
  selectedTokenId,
  user,
  onClose,
  onSelectUser,
  hideHeader,
  onOpenMember,
}: DialogPanelProps) {
  /** Набор id сообщений, оптимистично скрытых при удалении */
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<number>>(new Set());

  /** Карта оптимистично отредактированных сообщений: messageId → новый текст */
  const [editedMessages, setEditedMessages] = useState<Map<number, string>>(new Map());

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  /** Первый элемент нужен, чтобы отличать подгрузку старых сообщений от новых. */
  const previousFirstIdRef = useRef<number | null>(null);

  /** Флаг группового диалога */
  const isGroup = !!(user as any)?.isGroup;
  /** Telegram chat_id группы (хранится в userId для групп) */
  const groupChatId = isGroup ? String(user?.userId ?? '') : null;
  /** Тип чата группы */
  const groupChatType = (user as any)?.chatType as string | undefined;
  const isChannel = groupChatType === 'channel';

  const { users } = useUserList(projectId, selectedTokenId);
  const { bot } = useBotData(projectId);

  /** Данные проекта для извлечения узлов (нужны редактору кнопок для действия goto) */
  const { project } = useProjectData(projectId);

  /** Узлы проекта со всех листов для выбора цели действия goto в инлайн-кнопках */
  const availableNodes = useMemo(
    () => collectNodesFromProjectData((project?.data as Record<string, unknown>) ?? null),
    [project?.data],
  );

  const targetMessageId = readFileMessageId(user?.userId);
  // URL для загрузки сообщений: группа или личный диалог
  const baseRequestUrl = isGroup
    ? buildUsersApiUrl(`/api/projects/${projectId}/groups/${encodeURIComponent(groupChatId ?? '')}/messages`, selectedTokenId)
    : buildUsersApiUrl(
        `/api/projects/${projectId}/users/${user?.userId}/messages?includeGroupContext=true`,
        selectedTokenId
      );

  const requestUrl = targetMessageId ? `${baseRequestUrl}${baseRequestUrl.includes('?' ) ? '&' : '?'}aroundMessageId=${targetMessageId}` : baseRequestUrl;
  const {
    data: historyPage,
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useQuery<{ messages: BotMessageWithMedia[]; total: number | null }>({
    queryKey: [requestUrl, selectedTokenId, user?.userId],
    enabled: !!user?.userId,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      if (!response.ok) throw new Error('Не удалось загрузить сообщения');
      const data = await response.json();
      const countHeader = response.headers.get('X-Dialog-Message-Count');
      return { messages: Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [], total: countHeader === null ? null : Number(countHeader) };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  /** Последняя страница и общее число записей выбранного диалога. */
  const httpMessages = historyPage?.messages ?? [];

  const history = useOlderDialogMessages(baseRequestUrl, httpMessages, messagesScrollRef, !messagesLoading && !messagesError && !targetMessageId);
  const { liveMessages, resetLiveMessages, addOptimisticMessage, removeOptimisticMessage, wsDeletedIds, wsEditedMessages } =
    useDialogLiveMessages(projectId, selectedTokenId, user?.userId, isGroup ? groupChatId : null);

  /** Объединённые и дедуплицированные сообщения */
  const allMessages = useMemo(
    () => mergeMessages([...history.older, ...httpMessages.filter((message) => !history.older.some((item) => item.id === message.id))], liveMessages),
    [history.older, httpMessages, liveMessages],
  );

  /** Сообщения без оптимистично удалённых и удалённых через WS */
  const messages = useMemo(
    () => allMessages.filter((m) => !deletedMessageIds.has(m.id) && !wsDeletedIds.has(m.id)),
    [allMessages, deletedMessageIds, wsDeletedIds],
  );

  /** Сброс live-сообщений и удалённых id при смене пользователя */
  useEffect(() => {
    resetLiveMessages();
    setDeletedMessageIds(new Set());
    setEditedMessages(new Map());
    prevMessageCountRef.current = 0;
    previousFirstIdRef.current = null;
  }, [user?.userId, selectedTokenId, resetLiveMessages]);

  /** Автопрокрутка при первой загрузке и при новых live-сообщениях */
  useLayoutEffect(() => {
    if (messagesLoading) return;
    if (messages.length === 0) return;
    const firstId = messages[0]?.id ?? null;
    const prepended = previousFirstIdRef.current !== null && firstId !== previousFirstIdRef.current;
    previousFirstIdRef.current = firstId;
    if (prepended) { prevMessageCountRef.current = messages.length; return; }
    if (messages.length <= prevMessageCountRef.current) return;

    prevMessageCountRef.current = messages.length;

    const viewport = messagesScrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messagesLoading, messages.length]);

  useMessageTarget(messagesScrollRef, targetMessageId, messagesLoading, messages.length);
  // Мутация отправки для личного диалога
  const sendMessageMutation = useSendMessage({
    projectId,
    selectedTokenId,
    userId: user?.userId ? Number(user.userId) : undefined,
    userIdStr: user?.userId ? String(user.userId) : undefined,
    onSent: refetchMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  });

  // Мутация отправки для группы
  const sendGroupMessageMutation = useSendGroupMessage({
    projectId,
    groupId: groupChatId,
    selectedTokenId,
    onSent: refetchMessages,
  });

  const deleteMessageMutation = useDeleteMessage({
    projectId,
    selectedTokenId,
    onOptimisticRemove: (id) =>
      setDeletedMessageIds((prev) => new Set(prev).add(id)),
    onRollback: (id) =>
      setDeletedMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }),
    onDeleted: refetchMessages,
  });

  const editMessageMutation = useEditMessage({
    projectId,
    selectedTokenId,
    onOptimisticEdit: (messageId, newText) =>
      setEditedMessages((prev) => new Map(prev).set(messageId, newText)),
    onRollback: (messageId, originalText) =>
      setEditedMessages((prev) => {
        const next = new Map(prev);
        next.set(messageId, originalText);
        return next;
      }),
    onEdited: refetchMessages,
  });

  if (!user) {
    return <NoUserSelected />;
  }

  const handleSelectUser = onSelectUser || (() => {});

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {!hideHeader && (isGroup ? (
        /* Заголовок группового диалога */
        <div className="flex items-center justify-between gap-2 p-2 xs:p-2.5 sm:p-3 border-b">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={[
                'w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isChannel
                  ? 'bg-rose-100 dark:bg-rose-900'
                  : 'bg-violet-100 dark:bg-violet-900',
              ].join(' ')}
            >
              {isChannel ? (
                <Radio className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs sm:text-sm truncate leading-none">
                {user.firstName ?? 'Группа'}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isChannel ? 'Канал' : groupChatType === 'supergroup' ? 'Супергруппа' : 'Группа'}
                {groupChatId && ` · ${groupChatId}`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <DialogHeader
          user={user}
          users={users}
          formatUserName={formatUserName}
          onSelectUser={handleSelectUser}
          onClose={onClose}
        />
      ))}

      <div className="flex flex-1 min-h-0 min-w-0">
      <MessageNavigation messages={messages} scrollRef={messagesScrollRef} total={targetMessageId ? null : historyPage?.total ?? null} />
      {/* Содержимое области прокрутки не должно расширяться по длине сообщения. */}
      <ScrollArea
        ref={messagesScrollRef}
        className="min-h-0 min-w-0 flex-1 p-3 [&_[data-radix-scroll-area-viewport]>div]:!block"
        data-testid="dialog-messages-scroll-area"
      >
        {messagesLoading ? (
          <LoadingMessages />
        ) : messagesError ? (
          <p role="alert" className="p-4 text-sm text-muted-foreground">Не удалось открыть сообщение. Возможно, оно удалено или доступ к диалогу изменился.</p>
        ) : messages.length === 0 ? (
          <EmptyDialog />
        ) : (
          <div className="space-y-3 py-2">
            {(history.hasMore || history.loading || history.failed) && !targetMessageId && (
              <div className="flex justify-center">
                <button type="button" onClick={() => void history.loadOlder()} disabled={history.loading}
                  className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60">
                  {history.loading ? 'Загрузка сообщений…' : history.failed ? 'Не удалось загрузить. Повторить' : 'Загрузить предыдущие сообщения'}
                </button>
              </div>
            )}
            {messages.map((message, index) => {
              /** WS-запись с новым текстом, кнопками и раскладкой (если есть) */
              const wsRec = wsEditedMessages.get(message.id);
              /** Применяем оптимистичные правки и WS-правки к тексту и кнопкам сообщения */
              const displayMessage = editedMessages.has(message.id)
                ? { ...message, messageText: editedMessages.get(message.id)! }
                : wsRec
                ? {
                    ...message,
                    messageText: wsRec.messageText,
                    messageData: {
                      ...(message.messageData as object),
                      ...(wsRec.buttons !== undefined ? { buttons: wsRec.buttons } : {}),
                      ...(wsRec.buttonsPerRow !== undefined ? { buttonsPerRow: wsRec.buttonsPerRow } : {}),
                    },
                  }
                : message;
              return (
                <div key={message.id || index} data-dialog-index={index}>
                <MessageBubble
                  key={message.id || index}
                  message={displayMessage}
                  index={index}
                  user={message.messageType === 'user'
                    ? (isGroup
                        // В групповом диалоге — подставляем userId отправителя для аватарки
                        ? { ...user, userId: message.userId } as typeof user
                        : user)
                    : null}
                  bot={message.messageType === 'bot' ? bot : null}
                  projectId={projectId}
                  tokenId={selectedTokenId}
                  isGroupDialog={isGroup}
                  showSource={!isGroup}
                  onOpenMember={onOpenMember}
                  onDelete={!canActOnDialogMessage(isGroup, message.chatType)
                    ? undefined : (id) => deleteMessageMutation.mutate(id)}
                  isDeleting={
                    deleteMessageMutation.isPending &&
                    deleteMessageMutation.variables === message.id
                  }
                  onEdit={!canActOnDialogMessage(isGroup, message.chatType) ? undefined : (messageId, newText, originalText, buttons, buttonsPerRow) =>
                    editMessageMutation.mutate({ messageId, messageText: newText, originalText, buttons, buttonsPerRow })
                  }
                  availableNodes={availableNodes}
                  isEditing={
                    editMessageMutation.isPending &&
                    editMessageMutation.variables?.messageId === message.id
                  }
                />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      </div>

      <Separator />

      {/* Зона ввода */}
      <div className="flex-shrink-0 max-h-[55%] overflow-y-auto">
        <DialogInput
          isPending={isGroup ? sendGroupMessageMutation.isPending : sendMessageMutation.isPending}
          projectId={projectId}
          availableNodes={availableNodes}
          onSend={(text, mediaUrls, buttons, buttonsPerRow) => {
            if (isGroup) {
              sendGroupMessageMutation.mutate({ messageText: text, mediaUrls, buttons, buttonsPerRow });
            } else {
              sendMessageMutation.mutate({ messageText: text, mediaUrls, buttons, buttonsPerRow });
            }
          }}
        />

        {/* NodeSender только для личных диалогов */}
        {!isGroup && (
          <NodeSender
            projectId={projectId}
            selectedTokenId={selectedTokenId}
            userId={user?.userId ? Number(user.userId) : undefined}
            onSent={refetchMessages}
          />
        )}
      </div>

    </div>
  );
}
