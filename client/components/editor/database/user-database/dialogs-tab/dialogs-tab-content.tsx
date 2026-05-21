/**
 * @fileoverview Главный компонент вкладки "Диалоги"
 * @description Двухколоночный layout в стиле мессенджера: список слева, диалог справа.
 * На мобайле — переключение между списком и открытым диалогом.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Megaphone, X, Users, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserBotData } from '@shared/schema';
import { DialogPanel } from '../../dialog/dialog-panel';
import { BroadcastDialogPanel } from '../../dialog/broadcast-dialog-panel';
import { UserAvatar } from '../../dialog/components/user-avatar';
import { DialogList } from './dialog-list';
import { useLiveInvalidate } from '../hooks/use-live-invalidate';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useSyncGroups } from '../hooks/use-sync-groups';
import { useInfiniteUsers } from '../hooks/queries/use-infinite-users';
import { BotTokenSelector, ProjectSelector } from '../components/header';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';
import { formatUserName } from '../../utils';

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
  projectName,
  selectedTokenId: selectedTokenIdProp,
  onSelectToken,
  allProjects,
  onProjectChange,
  initialUser,
}: DialogsTabContentProps): React.JSX.Element {
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(initialUser ?? null);
  /** Флаг открытия виртуального диалога рассылок */
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  /** Флаг открытия модалки создания рассылки */
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

  /** Реагируем на изменение initialUser извне (переход из другой вкладки) */
  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
      setIsBroadcastDialogOpen(false);
    }
  }, [initialUser]);

  // Автоматически выбираем токен по умолчанию если снаружи не передан
  const projectTokensInfo = useProjectTokens([projectId]);
  const projectTokens = projectTokensInfo[0]?.tokens ?? [];
  const [internalTokenId, setInternalTokenId] = useState<number | null>(selectedTokenIdProp ?? null);
  const resolvedTokenId = selectedTokenIdProp ?? internalTokenId;

  useEffect(() => {
    if (resolvedTokenId !== null || projectTokens.length === 0) return;
    const defaultToken = projectTokens.find((t) => t.isDefault === 1) ?? projectTokens[0];
    if (!defaultToken) return;
    setInternalTokenId(defaultToken.id);
    onSelectToken?.(defaultToken.id);
  }, [projectTokens, resolvedTokenId, onSelectToken]);

  // Подписываемся на WS-события: обновляет кэш infinite-users (lastMessageText, порядок)
  useLiveInvalidate({ projectId, selectedTokenId: resolvedTokenId });

  // Загружаем первую страницу диалогов чтобы передать группы в useSyncGroups
  const { allUsers: dialogs } = useInfiniteUsers({
    projectId,
    selectedTokenId: resolvedTokenId,
    includeGroups: true,
    sortBy: 'lastInteraction',
    sortDir: 'desc',
  });

  // Синкаем названия и аватарки групп из Telegram при появлении групп в списке
  useSyncGroups(projectId, resolvedTokenId, dialogs);

  /** Сброс выбранного пользователя */
  const handleClose = () => {
    setSelectedUser(null);
    setIsBroadcastDialogOpen(false);
  };

  /** Выбор пользователя из списка или из DialogPanel */
  const handleSelectUser = (user: UserBotData) => {
    setSelectedUser(user);
    setIsBroadcastDialogOpen(false);
  };

  /** Клик по виртуальному элементу «Рассылка» */
  const handleSelectBroadcast = () => {
    setIsBroadcastDialogOpen(true);
    setSelectedUser(null);
  };

  /** Показывать селектор проекта только если несколько проектов */
  const showProjectSelector = !!allProjects && allProjects.length > 1 && !!onProjectChange;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Десктопный хедер — 2 строки */}
      <div className="hidden md:flex flex-col border-b border-border/50 bg-card flex-shrink-0">
        {/* Строка 1: навигация — проект + токен */}
        <div className="flex items-center gap-x-1.5 px-3 py-1 border-b border-border/30">
          <span className="text-xs font-semibold text-foreground">Диалоги</span>
          <span className="text-border/60 text-[10px]">·</span>
          {showProjectSelector ? (
            <ProjectSelector
              projects={allProjects!}
              selectedProjectId={projectId}
              onSelect={onProjectChange!}
            />
          ) : null}
          {projectTokens.length > 0 && (
            <BotTokenSelector
              tokens={projectTokens}
              selectedTokenId={resolvedTokenId}
              onSelect={(id) => {
                setInternalTokenId(id);
                onSelectToken?.(id);
                setSelectedUser(null);
              }}
            />
          )}
        </div>

        {/* Строка 2: split — рассылка (над списком) | пользователь (над диалогом) */}
        <div className="flex items-center">
          {/* Левая часть — над списком */}
          <div className="w-80 flex-shrink-0 border-r border-border px-3 py-1 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-6 text-[11px] px-1.5"
              onClick={() => setBroadcastModalOpen(true)}
            >
              <Megaphone className="h-3 w-3" />
              Рассылка
            </Button>
          </div>

          {/* Правая часть — над диалогом */}
          <div className="flex-1 min-w-0 px-3 py-1 flex items-center justify-between gap-2">
            {(selectedUser || isBroadcastDialogOpen) ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  {isBroadcastDialogOpen ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                        <Megaphone className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-xs font-medium truncate">Рассылка</span>
                    </>
                  ) : (
                    <>
                      <UserAvatar
                        key={selectedUser?.userId}
                        messageType="user"
                        user={selectedUser}
                        projectId={projectId}
                        tokenId={resolvedTokenId}
                        size={24}
                      />
                      <span className="text-xs font-medium truncate">{formatUserName(selectedUser)}</span>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleClose}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">Выберите диалог</span>
            )}
          </div>
        </div>
      </div>

      {/* Мобильный хедер — скрывается когда открыт диалог */}
      {!selectedUser && !isBroadcastDialogOpen && (
        <div className="md:hidden border-b border-border/50 bg-card px-3 py-2 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Диалоги</span>
            <span className="text-border/60">·</span>
            {showProjectSelector ? (
              <ProjectSelector
                projects={allProjects!}
                selectedProjectId={projectId}
                onSelect={onProjectChange!}
              />
            ) : (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {projectName && <>Проект: <span className="font-medium text-foreground">{projectName}</span></>}
              </span>
            )}
            {projectTokens.length > 0 && (
              <>
                <span className="text-border/60">·</span>
                <BotTokenSelector
                  tokens={projectTokens}
                  selectedTokenId={resolvedTokenId}
                  onSelect={(id) => {
                    setInternalTokenId(id);
                    onSelectToken?.(id);
                    setSelectedUser(null);
                  }}
                />
              </>
            )}
            <span className="text-border/60">·</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setBroadcastModalOpen(true)}
            >
              <Megaphone className="h-3.5 w-3.5" />
              + Рассылка
            </Button>
          </div>
        </div>
      )}

      {/* Desktop: двухколоночный layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Левая колонка — список диалогов */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col min-h-0">
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={selectedUser ? String(selectedUser.userId) : null}
            onSelectUser={handleSelectUser}
            onSelectBroadcast={handleSelectBroadcast}
            isBroadcastSelected={isBroadcastDialogOpen}
          />
        </div>

        {/* Правая колонка — открытый диалог, рассылка или заглушка */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {isBroadcastDialogOpen ? (
            <BroadcastDialogPanel
              projectId={projectId}
              selectedTokenId={resolvedTokenId}
              onClose={handleClose}
              hideHeader
            />
          ) : selectedUser ? (
            <DialogPanel
              key={selectedUser.userId}
              projectId={projectId}
              selectedTokenId={resolvedTokenId}
              user={selectedUser}
              onClose={handleClose}
              onSelectUser={handleSelectUser}
              hideHeader
            />
          ) : (
            <NoDialogSelected />
          )}
        </div>
      </div>

      {/* Mobile: переключение между списком и диалогом */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">
        {isBroadcastDialogOpen ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Компактный хедер: ← + Рассылка + ✕ */}
            <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 border-b border-border">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                <Megaphone className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-medium truncate flex-1 min-w-0">Рассылка</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClose}>
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
        ) : selectedUser ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Компактный хедер: ← + аватарка + имя + ✕ */}
            <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 border-b border-border">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <UserAvatar
                key={selectedUser.userId}
                messageType="user"
                user={selectedUser}
                projectId={projectId}
                tokenId={resolvedTokenId}
                size={24}
              />
              <span className="text-sm font-medium truncate flex-1 min-w-0">{formatUserName(selectedUser)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <DialogPanel
                key={selectedUser.userId}
                projectId={projectId}
                selectedTokenId={resolvedTokenId}
                user={selectedUser}
                onClose={handleClose}
                onSelectUser={handleSelectUser}
                hideHeader
              />
            </div>
          </div>
        ) : (
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={null}
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
    </div>
  );
}
