/**
 * @fileoverview Компонент вкладки пользователей
 * @description Отображает мобильный или desktop список пользователей
 */

import { UsersListState } from './users-list-state';
import { TabsContent } from '@/components/ui/tabs';
import { MobileUserList } from '../components/mobile';
import { DesktopTable } from '../components/desktop';
import { DatabaseContentProps } from './database-content-props';

/**
 * Пропсы компонента UsersTabContent
 */
type UsersTabContentProps = Pick<
  DatabaseContentProps,
  | 'usersError'
  | 'isUsersPending'
  | 'handleRefresh'
  | 'filterActive'
  | 'filterPremium'
  | 'setFilterActive'
  | 'setFilterPremium'
  | 'setSearchQuery'
  | 'isMobile'
  | 'filteredAndSortedUsers'
  | 'searchQuery'
  | 'formatUserName'
  | 'deleteUserMutation'
  | 'visibleColumns'
  | 'projectId'
  | 'selectedTokenId'
  | 'onOpenUserDetailsPanel'
  | 'onOpenDialogPanel'
  | 'onNavigateToDialog'
  | 'fetchNextPage'
  | 'hasNextPage'
  | 'isFetchingNextPage'
>;

/**
 * Компонент вкладки пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладки
 */
export function UsersTabContent(props: UsersTabContentProps): React.JSX.Element {
  const {
    isMobile,
    filteredAndSortedUsers,
    searchQuery,
    formatUserName,
    deleteUserMutation,
    visibleColumns,
    projectId,
    selectedTokenId,
    onOpenUserDetailsPanel,
    onOpenDialogPanel,
    onNavigateToDialog,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = props;

  /** Сбрасывает поиск и фильтры списка. */
  function resetFilters(): void {
    props.setSearchQuery('');
    props.setFilterActive(null);
    props.setFilterPremium(null);
  }

  const isFiltered = Boolean(searchQuery || props.filterActive !== null || props.filterPremium !== null);
  return (
    <TabsContent value="users" className="users-tab-content mt-0 w-full px-4 py-4">
      <div className="space-y-3 w-full min-w-0">
        <UsersListState pending={props.isUsersPending} error={props.usersError} onRetry={props.handleRefresh} />
        {!props.isUsersPending && !props.usersError && filteredAndSortedUsers.length === 0 && isFiltered && (
          <div className="py-10 text-center text-sm text-muted-foreground" role="status">
            <p>По заданным фильтрам пользователей нет</p>
            <button type="button" className="mt-3 text-foreground underline underline-offset-4" onClick={resetFilters}>Сбросить фильтры</button>
          </div>
        )}
        {!props.isUsersPending && !props.usersError && (filteredAndSortedUsers.length > 0 || !isFiltered) && (isMobile ? (
          <MobileUserList
            onOpenUserDetailsPanel={onOpenUserDetailsPanel}
            users={filteredAndSortedUsers}
            searchQuery={searchQuery}
            formatUserName={formatUserName}
            onNavigateToDialog={onNavigateToDialog}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        ) : (
          <DesktopTable
            users={filteredAndSortedUsers}
            searchQuery={searchQuery}
            formatUserName={formatUserName}
            deleteUserMutation={deleteUserMutation}
            visibleColumns={visibleColumns}
            projectId={projectId}
            tokenId={selectedTokenId}
            onOpenUserDetailsPanel={onOpenUserDetailsPanel}
            onOpenDialogPanel={onOpenDialogPanel}
            onNavigateToDialog={onNavigateToDialog}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        ))}
        {!props.isUsersPending && !props.usersError && filteredAndSortedUsers.length === 0 && props.hasNextPage && (
          <button type="button" className="w-full py-3 text-sm text-muted-foreground" disabled={props.isFetchingNextPage} onClick={() => props.fetchNextPage?.()}>
            {props.isFetchingNextPage ? 'Загрузка…' : 'Проверить следующих пользователей'}
          </button>
        )}
      </div>
    </TabsContent>
  );
}
