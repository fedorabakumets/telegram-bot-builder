/**
 * @fileoverview Компонент мобильного списка пользователей
 * @description Отображает список пользователей в виде карточек с поддержкой infinite scroll
 */

import { useEffect, useRef } from 'react';
import { UserBotData } from '@shared/schema';
import { MobileEmptyState } from './mobile-empty-state';
import { MobileUserCard } from './mobile-user-card';

/**
 * Пропсы компонента MobileUserList
 */
interface MobileUserListProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Обработчик перехода к диалогу с пользователем */
  onNavigateToDialog?: (user: UserBotData) => void;
  /** Загрузить следующую страницу */
  fetchNextPage?: () => void;
  /** Есть ли следующая страница */
  hasNextPage?: boolean;
  /** Идёт ли загрузка следующей страницы */
  isFetchingNextPage?: boolean;
}

/**
 * Компонент мобильного списка пользователей с поддержкой infinite scroll
 * @param props - Пропсы компонента
 * @returns JSX компонент списка
 */
export function MobileUserList(props: MobileUserListProps): React.JSX.Element {
  const {
    users,
    searchQuery,
    formatUserName,
    onNavigateToDialog,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = props;

  /** Ссылка на sentinel-элемент для Intersection Observer */
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage?.();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (users.length === 0) {
    return <MobileEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {users.map((user, index) => (
        <MobileUserCard
          key={user.id || index}
          user={user}
          index={index}
          formatUserName={formatUserName}
          onNavigateToDialog={onNavigateToDialog}
        />
      ))}
      {/* Sentinel-элемент для определения момента подгрузки следующей страницы */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="text-center py-2 text-muted-foreground text-sm">
          Загрузка...
        </div>
      )}
    </div>
  );
}
