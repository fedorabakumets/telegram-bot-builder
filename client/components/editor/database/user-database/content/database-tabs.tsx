/**
 * @fileoverview Единый список пользователей с переменными без дублирующих вкладок ответов.
 */

import { UsersTabContent } from './users-tab-content';
import { DatabaseContentProps } from './database-content-props';

/**
 * Пропсы компонента DatabaseTabs
 */
type DatabaseTabsProps = Pick<
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
  | 'onOpenUserDetailsPanel'
  | 'onOpenDialogPanel'
  | 'onNavigateToDialog'
  | 'handleUserStatusToggle'
  | 'deleteUserMutation'
  | 'visibleColumns'
  | 'projectId'
  | 'selectedTokenId'
  | 'fetchNextPage'
  | 'hasNextPage'
  | 'isFetchingNextPage'
  | 'variableToQuestionMap'
>;

/**
 * Показывает пользователей и сохранённые переменные в единой таблице.
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладок
 */
export function DatabaseTabs(props: DatabaseTabsProps): React.JSX.Element {
  const { isMobile, visibleColumns, ...restProps } = props;

  return (
      <UsersTabContent
        {...restProps}
        isMobile={isMobile}
        visibleColumns={visibleColumns}
        projectId={restProps.projectId}
        selectedTokenId={restProps.selectedTokenId}
        filteredAndSortedUsers={restProps.filteredAndSortedUsers}
        searchQuery={restProps.searchQuery}
        formatUserName={restProps.formatUserName}
        deleteUserMutation={restProps.deleteUserMutation}
        onOpenUserDetailsPanel={restProps.onOpenUserDetailsPanel}
        onOpenDialogPanel={restProps.onOpenDialogPanel}
        onNavigateToDialog={restProps.onNavigateToDialog}
        fetchNextPage={restProps.fetchNextPage}
        hasNextPage={restProps.hasNextPage}
        isFetchingNextPage={restProps.isFetchingNextPage}
      />
  );
}
