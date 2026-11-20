/**
 * @fileoverview Компонент вкладки пользователей
 * @description Отображает мобильный или desktop список пользователей
 */

import { UsersListState } from './users-list-state';
import { MobileUserList } from '../components/mobile';
import { DesktopTable } from '../components/desktop';
import { DatabaseContentProps } from './database-content-props';
import { useDirectoryControls } from './user-directory-controls';
import { FoundBroadcastProvider } from '../components/found-broadcast-context';
import { FoundBroadcastActions, FoundBroadcastToggle } from '../components/found-broadcast-actions';

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
  | 'variableToQuestionMap'
>;

/**
 * Компонент вкладки пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладки
 */
export function UsersTabContent(props: UsersTabContentProps): React.JSX.Element {
  const controls = useDirectoryControls();
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
    controls?.setSource('');
    controls?.setStatus('all');
    controls?.setPremium('all');
    props.setSearchQuery('');
    props.setFilterActive(null);
    props.setFilterPremium(null);
  }

  const isFiltered = Boolean(searchQuery || controls?.source || (controls && controls.status !== 'all') || props.filterActive !== null || props.filterPremium !== null);
  return (
    <FoundBroadcastProvider projectId={projectId} tokenId={selectedTokenId} search={searchQuery} audience="users" filterActive={props.filterActive} filterPremium={props.filterPremium}>
    <section aria-label="Пользователи" className="users-tab-content mt-0 w-full px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {props.isUsersPending ? 'Поиск пользователей…' : props.usersError ? 'Не удалось получить количество пользователей'
          : `Найдено пользователей: ${controls?.result?.total?.toLocaleString('ru-RU') ?? '—'}`}
      </p>
      <FoundBroadcastToggle /></div>
      <div className="mb-3 empty:hidden"><FoundBroadcastActions /></div>
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
            deleteUserMutation={deleteUserMutation}
            variableToQuestionMap={props.variableToQuestionMap}
            projectId={projectId}
            tokenId={selectedTokenId}
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
            variableToQuestionMap={props.variableToQuestionMap}
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
    </section>
    </FoundBroadcastProvider>
  );
}
