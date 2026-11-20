/**
 * @fileoverview Левая колонка со списком диалогов
 * @description Поиск, сегменты Все/Личные/Группы/Каналы, infinite scroll.
 * Виртуальный элемент «Рассылка» — только в сегменте «Все».
 */

import { UserDirectoryControls, useDirectoryControls } from '../content/user-directory-controls';
import { DialogListFilters } from './dialog-list-filters';
import { useEffect, useRef, useState } from 'react';
import { Search, MessageSquare, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserBotData } from '@shared/schema';
import { useInfiniteUsers } from '../hooks/queries/use-infinite-users';
import { useBroadcastRowPreview } from './broadcast-row-preview';
import { DialogListItem } from './dialog-list-item';
import { DialogSegmentChips } from './dialog-segment-chips';
import type { DialogKind } from './dialog-kind';
import { useSyncGroups } from '../hooks/use-sync-groups';
import type { MessagePeriod } from '@shared/message-period';
import { FoundBroadcastProvider } from '../components/found-broadcast-context';
import { FoundBroadcastActions, FoundBroadcastCheckbox, FoundBroadcastToggle } from '../components/found-broadcast-actions';
import { useProjectTokens } from '@/hooks/use-project-tokens';

/**
 * Пропсы компонента DialogList
 */
interface DialogListProps {
  /** ID проекта */
  projectId: number;
  /** ID выбранного токена бота */
  selectedTokenId?: number | null;
  /** ID выбранного пользователя */
  selectedUserId?: string | null;
  /** Бот открытой переписки для различения одинаковых пользователей у разных ботов. */
  selectedUserTokenId?: number | null;
  /** Обработчик выбора пользователя */
  onSelectUser: (user: UserBotData, searchTerm?: string, period?: MessagePeriod) => void;
  /** Сразу обновляет период в уже открытой переписке. */
  onMessagePeriodChange?: (period: MessagePeriod) => void;
  /** Обработчик клика по виртуальному элементу «Рассылка» */
  onSelectBroadcast?: () => void;
  /** Флаг активности виртуального элемента «Рассылка» */
  isBroadcastSelected?: boolean;
}

/**
 * Левая колонка списка диалогов с поиском, сегментами и infinite scroll
 * @param props - Пропсы компонента
 * @returns JSX элемент списка диалогов
 */
export function DialogList(props: DialogListProps): React.JSX.Element {
  return <UserDirectoryControls key={props.projectId} audience="dialogs"><DialogListContent {...props} /></UserDirectoryControls>;
}

/**
 * Сохраняет состояние списка и фильтров отдельно от вкладки пользователей.
 * @param props - Выбранная область переписок и обработчики выбора.
 * @returns Список с поиском, фильтрами и сегментами.
 */
function DialogListContent({
  projectId,
  selectedTokenId,
  selectedUserId,
  selectedUserTokenId,
  onSelectUser,
  onMessagePeriodChange,
  onSelectBroadcast,
  isBroadcastSelected,
}: DialogListProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [dialogKind, setDialogKind] = useState<DialogKind>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const controls = useDirectoryControls();
  /** Общая выдача подписывает каждую переписку её ботом без запросов на отдельную строку. */
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  const botLabels = new Map(tokens.map(token => [token.id,
    token.botUsername ? `@${token.botUsername}` : token.botFirstName || token.name || `Бот #${token.id}`]));
  const messageFrom = controls?.advanced.messageFrom;
  const messageTo = controls?.advanced.messageTo;
  /** Изменение времени применяется и к списку, и к открытой переписке без подтверждения. */
  useEffect(() => { onMessagePeriodChange?.({ messageFrom, messageTo }); }, [messageFrom, messageTo, onMessagePeriodChange]);
  /** В группах и каналах сохранённые ограничения профиля не меняют список и пустое состояние. */
  const hasProfileFilters = (dialogKind === 'all' || dialogKind === 'users') && Boolean(controls?.source
    || (controls?.status ?? 'all') !== 'all' || (controls?.premium ?? 'all') !== 'all'
    || Object.values(controls?.advanced ?? {}).some(value => value !== undefined && value !== ''));

  const { allUsers, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, usersError, refetch } =
    useInfiniteUsers({
      projectId,
      selectedTokenId,
      search,
      sortBy: 'lastInteraction',
      sortDir: 'desc',
      dialogKind,
      dialogUserFilters: true,
    });

  /** В общей области доступ групп проверяют карточки с собственным ботом, без подстановки бота по умолчанию. */
  const { statuses } = useSyncGroups(projectId, selectedTokenId, selectedTokenId == null ? [] : allUsers);

  /** Последняя рассылка для превью в виртуальном элементе */
  const { previewText: broadcastPreview, progress: broadcastProgress } = useBroadcastRowPreview({
    projectId,
    selectedTokenId,
  });

  const showBroadcastRow = dialogKind === 'all' && !!onSelectBroadcast;

  /** Infinite scroll через IntersectionObserver */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <FoundBroadcastProvider projectId={projectId} tokenId={selectedTokenId} search={search} audience="dialogs">
    <div className="flex flex-col h-full min-h-0">
      <div className="dialogs-list-search flex-shrink-0">
        <div className="flex items-center gap-2"><div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск диалогов..."
            aria-label="Поиск диалогов"
            className="pl-8 h-9 text-sm bg-background"
          />
        </div>{(dialogKind === 'all' || dialogKind === 'users') && <FoundBroadcastToggle />}</div>
      </div>

      <DialogListFilters projectId={projectId} tokenId={selectedTokenId ?? null} search={search} dialogKind={dialogKind} />
      <DialogSegmentChips value={dialogKind} onChange={setDialogKind} />
      {(dialogKind === 'all' || dialogKind === 'users') && <div className="shrink-0 border-b border-border px-4 py-2 empty:hidden">
        <FoundBroadcastActions />
      </div>}

      <div className="flex-1 overflow-y-auto min-h-0">
        {showBroadcastRow && (
          <button
            type="button"
            onClick={onSelectBroadcast}
            aria-pressed={!!isBroadcastSelected}
            className="dialogs-list-row"
          >
            <div className="dialogs-row-symbol flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium truncate">Рассылка</span>
                {broadcastProgress}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{broadcastPreview}</p>
            </div>
          </button>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : usersError ? (
          /** Сбой запроса не означает, что сохранённая история диалогов отсутствует. */
          <div role="alert" className="flex min-h-24 flex-col items-center justify-center gap-2 px-4 py-4 text-center text-sm text-muted-foreground">
            <span>Не удалось загрузить диалоги</span>
            <button type="button" className="rounded-lg border border-border px-3 py-1.5 hover:text-foreground" onClick={() => refetch()}>Повторить</button>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="flex min-h-24 flex-col items-center justify-center gap-2 px-4 py-4 text-center text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-40" />
            <span className="text-sm">{hasProfileFilters ? 'Диалоги по выбранным фильтрам не найдены' : search.trim() ? 'Диалоги не найдены' : 'Нет диалогов'}</span>
            {dialogKind === 'channels' && !search.trim() && (
              <span className="max-w-64 text-xs leading-relaxed">Сообщения каналов пока не записываются. В будущем они появятся здесь.</span>
            )}
          </div>
        ) : (
          <>
            {allUsers.map((user, index) => (
              <div key={`${user.tokenId ?? selectedTokenId}:${user.userId}-${index}`} className="flex min-w-0 items-center">
              {!(user as UserBotData & { isGroup?: boolean }).isGroup && <div className="pl-2 empty:hidden">
                <FoundBroadcastCheckbox userId={user.userId} name={user.firstName} username={user.userName} />
              </div>}
              <div className="min-w-0 flex-1"><DialogListItem
                key={`${user.userId}-${index}`}
                user={user}
                isSelected={selectedUserId === String(user.userId) && (selectedTokenId != null || !(user as UserBotData & { isGroup?: boolean }).isGroup || selectedUserTokenId === user.tokenId)}
                onClick={() => onSelectUser(user, search, { messageFrom: controls?.advanced.messageFrom, messageTo: controls?.advanced.messageTo })}
                projectId={projectId}
                tokenId={selectedTokenId ?? user.tokenId}
                botLabel={selectedTokenId == null ? dialogBotLabel(user, botLabels) : undefined}
                groupSyncStatus={statuses[String(user.userId)]}
              /></div>
              </div>
            ))}

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </FoundBroadcastProvider>
  );
}

/**
 * Подписывает общую карточку числом ботов либо именем единственного бота.
 * @param user - Пользователь с сохранёнными связями, без потери метаданных при выборе
 * @param labels - Подписи ботов текущего проекта
 * @returns Краткая подпись принадлежности переписки
 */
function dialogBotLabel(user: UserBotData, labels: Map<number, string>): string {
  const ids = [...new Set(user.botMemberships?.map(bot => bot.tokenId) ?? [])];
  if (ids.length > 1) {
    const tail = ids.length % 100;
    const word = tail >= 11 && tail <= 14 ? 'ботов' : ids.length % 10 === 1 ? 'бот' : ids.length % 10 >= 2 && ids.length % 10 <= 4 ? 'бота' : 'ботов';
    return `${ids.length} ${word}`;
  }
  const tokenId = ids[0] ?? user.tokenId;
  return labels.get(tokenId!) ?? `Бот #${tokenId ?? '—'}`;
}
