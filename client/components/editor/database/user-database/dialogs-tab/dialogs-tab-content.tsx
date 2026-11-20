/**
 * @fileoverview Главный компонент вкладки "Диалоги"
 * @description Двухколоночный layout в стиле мессенджера: список слева, диалог справа.
 * На мобайле — переключение между списком и открытым диалогом.
 */

import { readFileMessageUser } from '../../dialog/utils/file-message-target';
import { AnalyticsDialogReturn } from '@/components/editor/analytics/analytics-dialog-return';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogsWorkspaceHeader } from './dialogs-workspace-header';
import './dialogs-theme.css';
/** Общие портальные меню переиспользуют оформление вкладки пользователей. */
import '../content/users-workspace.css';
import './dialogs-layout.css';
import './dialogs-controls.css';
import type { UserBotData } from '@/types/bot';
import { DialogPanel } from '../../dialog/dialog-panel';
import { BroadcastDialogPanel } from '../../dialog/broadcast-dialog-panel';
import type { MessagePeriod } from '@shared/message-period';
import { DialogList } from './dialog-list';
import { DialogHeaderIdentity } from './dialog-header-identity';
import { useLiveInvalidate } from '../hooks/use-live-invalidate';
import { useBroadcastLiveInvalidate } from '@/components/editor/broadcast/hooks/use-broadcast-live-invalidate';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { DialogProfileData } from '../../dialog/components/dialog-profile-data';
import type { BotMessageWithMedia } from '../../dialog/types';
import type { UserBotMembership } from '@shared/user-bot-membership';

/**
 * Пропсы компонента DialogsTabContent
 */
interface DialogsTabContentProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName?: string;
  /** ID выбранного токена бота */
  selectedTokenId?: number | null;
  /** Колбэк для обновления выбранного токена снаружи */
  onSelectToken?: (tokenId: number | null) => void;
  /** Список всех проектов для селектора */
  allProjects?: Array<{ id: number; name: string }>;
  /** Колбэк смены проекта */
  onProjectChange?: (projectId: number) => void;
  /** Пользователь для автоматического открытия диалога (из другой вкладки) */
  initialUser?: UserBotData | null;
}

/**
 * Заглушка для правой колонки когда диалог не выбран
 * @returns JSX элемент заглушки
 */
function NoDialogSelected(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <MessageSquare className="h-12 w-12 opacity-20" />
      <p className="text-sm">Выберите диалог</p>
    </div>
  );
}

/**
 * Главный layout вкладки "Диалоги"
 * @param props - Пропсы компонента
 * @returns JSX элемент вкладки диалогов
 */
export function DialogsTabContent({
  projectId,
  selectedTokenId: selectedTokenIdProp,
  onSelectToken,
  allProjects,
  onProjectChange,
  initialUser,
}: DialogsTabContentProps): React.JSX.Element {
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(() => initialUser ?? readFileMessageUser());
  /** Ограничение ленты внутри пользователя; null объединяет историю его ботов. */
  const [viewTokenId, setViewTokenId] = useState<number | null>(null);
  /** Явно выбранный отправитель ответа в общей ленте. */
  const [selectedReplyTokenId, setReplyTokenId] = useState<number | null>(initialUser?.tokenId ?? null);
  /** Флаг открытия виртуального диалога рассылок */
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  /** Флаг открытия модалки создания рассылки */
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  /** Открытый профиль группы, участника или собеседника. */
  const [profileUser, setProfileUser] = useState<UserBotData | null>(null);
  /** Проект фиксируется при открытии, чтобы смена вкладки не переадресовала загрузку профиля. */
  const [profileProjectId, setProfileProjectId] = useState(projectId);
  /** Бот фотографии и группового контекста не меняется при выборе другого отправителя ответа. */
  const [profileTokenId, setProfileTokenId] = useState<number | null>(null);
  /** Название исходной группы для профиля автора. */
  const [profileMemberGroup, setProfileMemberGroup] = useState<string | null>(null);

  /** Открывает собеседника, автора группового сообщения или выбранного бота. */
  const openMemberProfile = (message: BotMessageWithMedia) => {
    if (message.messageType === 'bot') {
      const token = projectTokens.find((item) => item.id === (message.tokenId ?? conversationTokenId));
      showProfile({ userId: 'bot', isBot: true, firstName: token?.botFirstName ?? token?.name ?? 'Бот', userName: token?.botUsername }, null, token?.id ?? null);
      return;
    }
    if (selectedUser && !selectedUser.isGroup && !String(selectedUser.userId).startsWith('-')) {
      showProfile(selectedUser, null, message.tokenId ?? conversationTokenId);
      return;
    }
    const id = String(message.userId ?? '');
    if (!/^[1-9]\d*$/.test(id)) return;
    const data = message.messageData as { from_user?: { first_name?: string; last_name?: string; username?: string } } | null;
    showProfile({ userId: id, firstName: data?.from_user?.first_name, lastName: data?.from_user?.last_name, userName: data?.from_user?.username }, selectedUser?.firstName ?? 'группа', message.tokenId ?? conversationTokenId);
  };

  /** Реагируем на изменение initialUser извне (переход из другой вкладки) */
  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
      setViewTokenId(null);
      setReplyTokenId(initialUser.tokenId ?? null);
      setIsBroadcastDialogOpen(false);
    }
  }, [initialUser]);

  /** Общая область сохраняет отдельный маршрут бота для каждой переписки. */
  const projectTokensInfo = useProjectTokens([projectId]);
  const projectTokens = projectTokensInfo[0]?.tokens ?? [];
  const [internalTokenId, setInternalTokenId] = useState<number | null>(
    selectedTokenIdProp !== undefined ? selectedTokenIdProp : null,
  );
  /** Выбранный бот должен принадлежать текущему проекту, включая момент переключения. */
  const requestedTokenId = selectedTokenIdProp !== undefined ? selectedTokenIdProp : internalTokenId;
  const resolvedTokenId = requestedTokenId != null && projectTokens.some((token) => token.id === requestedTokenId)
    ? requestedTokenId : null;
  /** Переключатели доступны только для ботов с сохранённой перепиской этого пользователя. */
  const memberships = (selectedUser as UserBotData & {
    /** Боты пользователя из общей строки списка. */ botMemberships?: UserBotMembership[];
  } | null)?.botMemberships ?? [];
  const memberTokenIds = new Set(memberships.map(member => member.tokenId));
  if (selectedUser?.tokenId != null) memberTokenIds.add(selectedUser.tokenId);
  const conversationTokens = projectTokens.filter(token => memberTokenIds.has(token.id));
  /** Ответ всегда адресуется одному боту; общая история не превращается в групповую отправку. */
  const replyTokenId = resolvedTokenId ?? conversationTokens.find(token => token.id === selectedReplyTokenId)?.id
    ?? conversationTokens.find(token => token.id === selectedUser?.tokenId)?.id ?? null;
  const conversationTokenId = replyTokenId;
  /** Группы остаются отдельными парами бот/чат, личная история допускает общую ленту. */
  const unifiedUser = resolvedTokenId == null && !!selectedUser && !selectedUser.isGroup && !String(selectedUser.userId).startsWith('-');
  const historyTokenId = unifiedUser ? viewTokenId : conversationTokenId;
  /** Выбор конкретной ленты одновременно выбирает её бота для следующего ответа. */
  const handleHistoryTokenChange = (id: number | null) => {
    if (id != null && !memberTokenIds.has(id)) return;
    setViewTokenId(id);
    if (id != null) setReplyTokenId(id);
  };
  /** Открывает общий профиль человека, сохраняя конкретный контекст фотографии или группы. */
  const showProfile = (user: UserBotData, memberGroup: string | null = null, tokenId: number | null = conversationTokenId) => {
    if (tokenId != null && !projectTokens.some(token => token.id === tokenId)) return;
    setProfileProjectId(projectId);
    setProfileTokenId(tokenId);
    setProfileMemberGroup(memberGroup);
    setProfileUser(user);
  };
  /** Одинаковый вход в профиль из широкой и мобильной шапки. */
  const openCurrentProfile = () => { if (selectedUser) showProfile(selectedUser); };
  const previousScope = useRef(`${projectId}:${resolvedTokenId}`);

  /** При смене области закрываем диалог предыдущего бота. */
  useEffect(() => {
    const scope = `${projectId}:${resolvedTokenId}`;
    if (previousScope.current === scope) return;
    previousScope.current = scope;
    setSelectedUser(null);
    setIsBroadcastDialogOpen(false);
    setProfileUser(null);
    setViewTokenId(null);
    setReplyTokenId(null);
  }, [projectId, resolvedTokenId]);

  useEffect(() => {
    if (selectedTokenIdProp !== undefined) {
      setInternalTokenId(selectedTokenIdProp);
    }
  }, [selectedTokenIdProp]);

  useEffect(() => {
    if (projectTokens.length === 0 || requestedTokenId == null) return;
    const tokenExists =
      requestedTokenId != null && projectTokens.some((t) => t.id === requestedTokenId);
    if (tokenExists) return;
    /** Удалённый или чужой бот возвращает в общую область без выбора другого отправителя. */
    setInternalTokenId(null);
    onSelectToken?.(null);
  }, [projectTokens, requestedTokenId, onSelectToken]);

  // Подписываемся на WS-события: обновляет кэш infinite-users (lastMessageText, порядок)
  useLiveInvalidate({ projectId, selectedTokenId: resolvedTokenId });
  // Подписываемся на WS-события broadcast-progress: обновляет кэш рассылок
  useBroadcastLiveInvalidate({ projectId, selectedTokenId: resolvedTokenId });

  /** Фраза списка переносится в поиск по сообщениям при выборе собеседника. */
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  /** Период сообщений выбранного собеседника, независимо от поиска по тексту. */
  const [messageSearchPeriod, setMessageSearchPeriod] = useState<MessagePeriod>({});
  /** Повторный выбор собеседника заново открывает поиск после его закрытия. */
  const [messageSearchSession, setMessageSearchSession] = useState(0);
  /** Сброс выбранного пользователя */
  const handleClose = () => {
    setSelectedUser(null);
    setIsBroadcastDialogOpen(false);
    setProfileUser(null);
  };

  /** Выбор пользователя из списка или из DialogPanel */
  const handleSelectUser = (user: UserBotData, searchTerm = '', period: MessagePeriod = {}) => {
    /** Строка общего списка обязана передать собственного бота, без подстановки предыдущего. */
    const userTokenId = resolvedTokenId ?? user.tokenId;
    if (userTokenId == null || !projectTokens.some((token) => token.id === userTokenId)) return;
    setMessageSearchTerm(searchTerm);
    setMessageSearchPeriod(period);
    setMessageSearchSession(value => value + 1);
    setProfileUser(null);
    setSelectedUser({ ...user, tokenId: userTokenId });
    setViewTokenId(null);
    setReplyTokenId(userTokenId);
    setIsBroadcastDialogOpen(false);
  };

  /** Переход из переписки сохраняет её отправителя независимо от общей области списка. */
  const handleSelectConversationUser = (user: UserBotData) => {
    if (conversationTokenId == null) return;
    handleSelectUser({ ...user, tokenId: conversationTokenId });
  };

  /** Клик по виртуальному элементу «Рассылка» */
  const handleSelectBroadcast = () => {
    setProfileUser(null);
    setIsBroadcastDialogOpen(true);
    setSelectedUser(null);
  };

  return (
    <div className="dialogs-workspace flex flex-col h-full min-h-0 overflow-hidden">
      <AnalyticsDialogReturn />
      <DialogsWorkspaceHeader projectId={projectId} projects={allProjects} onProjectChange={onProjectChange}
        hasConversation={!!selectedUser || isBroadcastDialogOpen}
        tokens={projectTokens} tokenId={resolvedTokenId} onNewBroadcast={() => setBroadcastModalOpen(true)}
        onSelectToken={(id) => { setInternalTokenId(id); onSelectToken?.(id); setSelectedUser(null); }}>
        <div className="flex min-w-0 items-center gap-2">
          {/* Заголовок рассылки открывает создание сообщения, как основная кнопка в шапке. */}
          {isBroadcastDialogOpen ? <Button variant="ghost" className="dialogs-action h-8 gap-2 px-2"
              onClick={() => setBroadcastModalOpen(true)} aria-label="Создать новую рассылку">
              <Megaphone className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Рассылка</span>
            </Button>
            : selectedUser && conversationTokenId != null ? <DialogHeaderIdentity key={`${conversationTokenId}:${selectedUser.userId}`}
                user={selectedUser} projectId={projectId} tokenId={conversationTokenId}
                tokens={unifiedUser ? conversationTokens : undefined} historyTokenId={historyTokenId}
                onHistoryTokenChange={handleHistoryTokenChange} replyTokenId={replyTokenId} onReplyTokenChange={setReplyTokenId}
                onOpenProfile={openCurrentProfile} />
              : <span className="text-sm text-muted-foreground">Выберите диалог</span>}
        </div>
        {(selectedUser || isBroadcastDialogOpen) && <Button variant="ghost" size="icon"
          className="dialogs-action h-8 w-8 shrink-0" onClick={handleClose} aria-label="Закрыть диалог"><X className="h-4 w-4" /></Button>}
      </DialogsWorkspaceHeader>

      {/* Две колонки списка и переписки на широкой панели. */}
      <div className="dialogs-workspace-body hidden md:flex flex-1 min-h-0">
        {/* Левая колонка — список диалогов */}
        <div className="dialogs-list-column flex-shrink-0 flex flex-col min-h-0">
          <DialogList
            onMessagePeriodChange={setMessageSearchPeriod}
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={selectedUser ? String(selectedUser.userId) : null}
            selectedUserTokenId={unifiedUser ? null : conversationTokenId}
            onSelectUser={handleSelectUser}
            onSelectBroadcast={handleSelectBroadcast}
            isBroadcastSelected={isBroadcastDialogOpen}
          />
        </div>

        {/* Правая колонка — открытый диалог, рассылка или заглушка */}
        <div className="dialogs-chat-column flex-1 min-w-0 flex flex-col min-h-0">
          {isBroadcastDialogOpen ? (
            <BroadcastDialogPanel
              projectId={projectId}
              selectedTokenId={resolvedTokenId}
              onClose={handleClose}
              hideHeader
            />
          ) : selectedUser && conversationTokenId != null ? (
            <DialogPanel
              key={`${selectedUser.userId}:${messageSearchSession}`}
              searchTerm={messageSearchTerm}
              searchPeriod={messageSearchPeriod}
              projectId={projectId}
              selectedTokenId={conversationTokenId}
              historyTokenId={historyTokenId}
              user={selectedUser}
              onClose={handleClose}
              onSelectUser={handleSelectConversationUser}
              onOpenMember={openMemberProfile}
              hideHeader
            />
          ) : (
            <NoDialogSelected />
          )}
        </div>
      </div>

      {/* Переключение списка и переписки на узкой панели. */}
      <div className="dialogs-mobile-body flex md:hidden flex-col flex-1 min-h-0">
        {isBroadcastDialogOpen ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Компактный хедер: ← + Рассылка + ✕ */}
            <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 border-b border-border">
              <Button variant="ghost" size="icon" className="dialogs-action h-8 w-8 shrink-0" onClick={handleClose} aria-label="К списку диалогов">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {/* На узком экране заголовок выполняет то же действие создания рассылки. */}
              <Button variant="ghost" className="dialogs-action h-8 min-w-0 flex-1 justify-start gap-2 px-2"
                onClick={() => setBroadcastModalOpen(true)} aria-label="Создать новую рассылку">
                <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">Рассылка</span>
              </Button>
              <Button variant="ghost" size="icon" className="dialogs-action h-8 w-8 shrink-0" onClick={handleClose} aria-label="Закрыть диалог">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <BroadcastDialogPanel
                projectId={projectId}
                selectedTokenId={resolvedTokenId}
                onClose={handleClose}
                hideHeader
              />
            </div>
          </div>
        ) : selectedUser && conversationTokenId != null ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Компактный хедер: ← + аватарка + имя + ✕ */}
            <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 border-b border-border">
              <Button variant="ghost" size="icon" className="dialogs-action h-8 w-8 shrink-0" onClick={handleClose} aria-label="К списку диалогов">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogHeaderIdentity key={`${conversationTokenId}:${selectedUser.userId}`}
                user={selectedUser} projectId={projectId} tokenId={conversationTokenId}
                tokens={unifiedUser ? conversationTokens : undefined} historyTokenId={historyTokenId}
                onHistoryTokenChange={handleHistoryTokenChange} replyTokenId={replyTokenId} onReplyTokenChange={setReplyTokenId}
                onOpenProfile={openCurrentProfile} />
              <Button variant="ghost" size="icon" className="dialogs-action h-8 w-8 shrink-0" onClick={handleClose} aria-label="Закрыть диалог">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <DialogPanel
                key={`${selectedUser.userId}:${messageSearchSession}`}
                searchTerm={messageSearchTerm}
                searchPeriod={messageSearchPeriod}
                projectId={projectId}
                selectedTokenId={conversationTokenId}
                historyTokenId={historyTokenId}
                user={selectedUser}
                onClose={handleClose}
                onSelectUser={handleSelectConversationUser}
                onOpenMember={openMemberProfile}
                hideHeader
              />
            </div>
          </div>
        ) : (
          <DialogList
            onMessagePeriodChange={setMessageSearchPeriod}
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={null}
            selectedUserTokenId={unifiedUser ? null : conversationTokenId}
            onSelectUser={handleSelectUser}
            onSelectBroadcast={handleSelectBroadcast}
            isBroadcastSelected={false}
          />
        )}
      </div>

      {/* Модалка создания рассылки */}
      <NewBroadcastModal
        open={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        projectId={projectId}
        tokenId={resolvedTokenId}
      />
      <Sheet open={!!profileUser && profileProjectId === projectId} onOpenChange={(open) => { if (!open) setProfileUser(null); }}>
        <SheetContent side="right" hideClose className="dialogs-overlay !w-full !max-w-lg !p-0">
          <SheetTitle className="sr-only">Профиль диалога</SheetTitle>
          {profileUser && profileProjectId === projectId && <DialogProfileData key={`${profileProjectId}:${profileTokenId}:${profileUser.userId}`} user={profileUser} projectId={profileProjectId} tokenId={profileTokenId} memberGroup={profileMemberGroup} onClose={() => setProfileUser(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
