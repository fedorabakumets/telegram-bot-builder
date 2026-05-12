/**
 * @fileoverview Компонент вкладок панели БД
 * @description Отображает Tabs с переключателями и контентом: пользователи, диалоги, ответы
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UsersTabContent } from './users-tab-content';
import { ResponsesTabContent } from './responses-tab-content';
import { DatabaseContentProps } from './database-content-props';
import { DialogsTabContent } from '../dialogs-tab/dialogs-tab-content';

/**
 * Пропсы компонента DatabaseTabs
 */
type DatabaseTabsProps = Pick<
  DatabaseContentProps,
  | 'isMobile'
  | 'filteredAndSortedUsers'
  | 'searchQuery'
  | 'formatUserName'
  | 'onOpenUserDetailsPanel'
  | 'onOpenDialogPanel'
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
    <Tabs defaultValue="users" className="w-full flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-3 flex-shrink-0 bg-muted/80 backdrop-blur-sm">
        <TabsTrigger value="users" className="text-sm font-medium">
          Пользователи
        </TabsTrigger>
        <TabsTrigger value="dialogs" className="text-sm font-medium">
          Диалоги
        </TabsTrigger>
        <TabsTrigger value="responses" className="text-sm font-medium">
          Ответы пользователей
        </TabsTrigger>
      </TabsList>

      <UsersTabContent
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
        fetchNextPage={restProps.fetchNextPage}
        hasNextPage={restProps.hasNextPage}
        isFetchingNextPage={restProps.isFetchingNextPage}
      />

      {/* Вкладка диалогов — двухколоночный layout в стиле мессенджера */}
      <TabsContent value="dialogs" className="mt-0 h-full flex-1 min-h-0">
        <DialogsTabContent
          projectId={restProps.projectId}
          selectedTokenId={restProps.selectedTokenId}
        />
      </TabsContent>

      <ResponsesTabContent
        users={restProps.filteredAndSortedUsers}
        formatUserName={restProps.formatUserName}
      />
    </Tabs>
  );
}
