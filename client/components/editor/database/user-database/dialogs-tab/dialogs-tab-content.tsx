/**
 * @fileoverview Главный компонент вкладки "Диалоги"
 * @description Двухколоночный layout в стиле мессенджера: список слева, диалог справа.
 * На мобайле — переключение между списком и открытым диалогом.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserBotData } from '@shared/schema';
import { DialogPanel } from '../../dialog/dialog-panel';
import { DialogList } from './dialog-list';
import { useLiveInvalidate } from '../hooks/use-live-invalidate';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useSyncGroups } from '../hooks/use-sync-groups';
import { useInfiniteUsers } from '../hooks/queries/use-infinite-users';
import { BotTokenSelector, ProjectSelector } from '../components/header';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';

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
}: DialogsTabContentProps): React.JSX.Element {
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);
  /** Флаг открытия модалки создания рассылки */
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

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
  const handleClose = () => setSelectedUser(null);

  /** Выбор пользователя из списка или из DialogPanel */
  const handleSelectUser = (user: UserBotData) => setSelectedUser(user);

  /** Показывать селектор проекта только если несколько проектов */
  const showProjectSelector = !!allProjects && allProjects.length > 1 && !!onProjectChange;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Хедер с селекторами проекта и токена */}
      <div className="border-b border-border/50 bg-card px-3 py-2 sm:px-4 sm:py-3 flex-shrink-0">
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
              <span className="text-border/60 hidden sm:inline">·</span>
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
          <span className="text-border/60 hidden sm:inline">·</span>
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

      {/* Desktop: двухколоночный layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Левая колонка — список диалогов */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col min-h-0">
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={selectedUser ? String(selectedUser.userId) : null}
            onSelectUser={handleSelectUser}
          />
        </div>

        {/* Правая колонка — открытый диалог или заглушка */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {selectedUser ? (
            <DialogPanel
              projectId={projectId}
              selectedTokenId={resolvedTokenId}
              user={selectedUser}
              onClose={handleClose}
              onSelectUser={handleSelectUser}
            />
          ) : (
            <NoDialogSelected />
          )}
        </div>
      </div>

      {/* Mobile: переключение между списком и диалогом */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">
        {selectedUser ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Кнопка "Назад" */}
            <div className="flex-shrink-0 px-2 py-1 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="gap-1 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <DialogPanel
                projectId={projectId}
                selectedTokenId={resolvedTokenId}
                user={selectedUser}
                onClose={handleClose}
                onSelectUser={handleSelectUser}
              />
            </div>
          </div>
        ) : (
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={null}
            onSelectUser={handleSelectUser}
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
