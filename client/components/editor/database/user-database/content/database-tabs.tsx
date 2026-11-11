/**
 * @fileoverview Компонент вкладок панели БД
 * @description Отображает Tabs с переключателями и контентом
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTabContent } from './users-tab-content';
import { ResponsesTabContent } from './responses-tab-content';
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
>;

/**
 * Компонент вкладок панели БД
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладок
 */
export function DatabaseTabs(props: DatabaseTabsProps): React.JSX.Element {
  const { isMobile, visibleColumns, ...restProps } = props;

  return (
    <Tabs defaultValue="users" className="w-full pb-4">
      <TabsList className="grid w-full grid-cols-2 flex-shrink-0 rounded-none border-b border-border bg-transparent px-4">
        <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
          Пользователи
        </TabsTrigger>
        <TabsTrigger value="responses" className="rounded-none border-b-2 border-transparent text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
          Ответы пользователей
        </TabsTrigger>
      </TabsList>

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
      <ResponsesTabContent
        users={restProps.filteredAndSortedUsers}
        formatUserName={restProps.formatUserName}
      />
    </Tabs>
  );
}
