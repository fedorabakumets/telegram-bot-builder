/**
 * @fileoverview Левая колонка со списком диалогов
 * @description Поиск, бесконечная прокрутка и список карточек диалогов.
 * Содержит виртуальный элемент «Рассылка» сверху списка.
 */

import { useEffect, useRef, useState } from 'react';
import { Search, MessageSquare, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserBotData } from '@shared/schema';
import { useInfiniteUsers } from '../hooks/queries/use-infinite-users';
import { useBroadcasts } from '@/components/editor/broadcast/hooks/use-broadcasts';
import { DialogListItem } from './dialog-list-item';

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
  /** Обработчик выбора пользователя */
  onSelectUser: (user: UserBotData) => void;
  /** Обработчик клика по виртуальному элементу «Рассылка» */
  onSelectBroadcast?: () => void;
  /** Флаг активности виртуального элемента «Рассылка» */
  isBroadcastSelected?: boolean;
}

/**
 * Левая колонка списка диалогов с поиском и infinite scroll
 * @param props - Пропсы компонента
 * @returns JSX элемент списка диалогов
 */
export function DialogList({
  projectId,
  selectedTokenId,
  selectedUserId,
  onSelectUser,
  onSelectBroadcast,
  isBroadcastSelected,
}: DialogListProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { allUsers, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteUsers({
      projectId,
      selectedTokenId,
      search,
      sortBy: 'lastInteraction',
      sortDir: 'desc',
      includeGroups: true,
    });

  /** Последняя рассылка для превью в виртуальном элементе */
  const { broadcasts } = useBroadcasts(projectId, selectedTokenId);
  const lastBroadcast = broadcasts[0];
  const broadcastPreview = lastBroadcast
    ? lastBroadcast.messageText.replace(/<[^>]*>/g, '').slice(0, 40)
    : 'Нет рассылок';

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
    <div className="flex flex-col h-full min-h-0">
      {/* Поле поиска */}
      <div className="p-3 border-b border-border/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск диалогов..."
            className="pl-8 h-8 text-sm bg-muted/50"
          />
        </div>
      </div>

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Виртуальный элемент «Рассылка» — всегда первый */}
        {onSelectBroadcast && (
          <button
            type="button"
            onClick={onSelectBroadcast}
            className={[
              'w-full flex items-center gap-3 px-3 py-3 text-left',
              'transition-colors border-b border-border/30',
              'hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isBroadcastSelected
                ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/10'
                : '',
            ].join(' ')}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-200 dark:from-violet-800 dark:to-fuchsia-800 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium truncate">📢 Рассылка</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{broadcastPreview}</p>
            </div>
          </button>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : allUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-40" />
            <span className="text-sm">Нет диалогов</span>
          </div>
        ) : (
          <>
            {allUsers.map((user, index) => (
              <DialogListItem
                key={`${user.userId}-${index}`}
                user={user}
                isSelected={selectedUserId === String(user.userId)}
                onClick={() => onSelectUser(user)}
                projectId={projectId}
                tokenId={selectedTokenId}
              />
            ))}

            {/* Sentinel для infinite scroll */}
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
  );
}
