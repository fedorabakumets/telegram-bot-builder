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
      <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-muted/80 backdrop-blur-sm">
        <TabsTrigger value="users" className="text-sm font-medium">
          Пользователи
        </TabsTrigger>
        <TabsTrigger value="responses" className="text-sm font-medium">
          Ответы пользователей
        </TabsTrigger>
      </TabsList>

      <UsersTabContent isMobile={isMobile} visibleColumns={visibleColumns} projectId={restProps.projectId} filteredAndSortedUsers={restProps.filteredAndSortedUsers} searchQuery={restProps.searchQuery} formatUserName={restProps.formatUserName} onOpenUserDetailsPanel={restProps.onOpenUserDetailsPanel} onOpenDialogPanel={restProps.onOpenDialogPanel} handleUserStatusToggle={restProps.handleUserStatusToggle} deleteUserMutation={restProps.deleteUserMutation} />
      <ResponsesTabContent
        users={restProps.filteredAndSortedUsers}
        formatUserName={restProps.formatUserName}
      />
    </Tabs>
  );
}
