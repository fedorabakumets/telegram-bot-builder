/**
 * @fileoverview Компонент таблицы пользователей для desktop
 * @description Отображает таблицу пользователей со всеми ячейками и поддержкой infinite scroll
 */

import { useEffect, useRef } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { DesktopTableHeader } from './desktop-table-header';
import { DesktopEmptyRow } from './desktop-empty-row';
import { DesktopTableRow } from './desktop-table-row';

/**
 * Пропсы компонента DesktopTable
 */
interface DesktopTableProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Количество видимых колонок */
  visibleColumns?: number;
  /** ID проекта */
  projectId: number;
  /** Открытие панели деталей пользователя */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Открытие диалоговой панели */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Переход на вкладку «Диалоги» с пользователем */
  onNavigateToDialog?: (user: UserBotData) => void;
  /** ID токена для резолва аватара */
  tokenId?: number | null;
  /** Загрузить следующую страницу */
  fetchNextPage?: () => void;
  /** Есть ли следующая страница */
  hasNextPage?: boolean;
  /** Идёт ли загрузка следующей страницы */
  isFetchingNextPage?: boolean;
}

/**
 * Компонент таблицы пользователей для desktop с поддержкой infinite scroll
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function DesktopTable(props: DesktopTableProps): React.JSX.Element {
  const {
    users,
    searchQuery,
    visibleColumns,
    projectId,
    tokenId,
    formatUserName,
    deleteUserMutation,
    onOpenUserDetailsPanel,
    onOpenDialogPanel,
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

  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <DesktopTableHeader visibleColumns={visibleColumns} />
          <TableBody>
            {users.length === 0 ? (
              <DesktopEmptyRow searchQuery={searchQuery} />
            ) : (
              users.map((user, index) => (
                <DesktopTableRow
                  key={user.id || index}
                  user={user}
                  index={index}
                  visibleColumns={visibleColumns}
                  projectId={projectId}
                  tokenId={tokenId}
                  formatUserName={formatUserName}
                  deleteUserMutation={deleteUserMutation}
                  onOpenUserDetailsPanel={onOpenUserDetailsPanel}
                  onOpenDialogPanel={onOpenDialogPanel}
                  onNavigateToDialog={onNavigateToDialog}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Sentinel-элемент для определения момента подгрузки следующей страницы */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="text-center py-2 text-muted-foreground text-sm">Загрузка...</div>
      )}
    </div>
  );
}
