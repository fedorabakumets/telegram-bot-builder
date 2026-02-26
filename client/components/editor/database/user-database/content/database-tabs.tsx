/**
 * @fileoverview Компонент вкладок панели БД
 * @description Отображает Tabs с переключателями и контентом
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  | 'setSelectedUser'
  | 'setShowUserDetails'
  | 'onOpenDialogPanel'
  | 'setSelectedUserForDialog'
  | 'setShowDialog'
  | 'scrollToBottom'
  | 'handleUserStatusToggle'
  | 'deleteUserMutation'
>;

/**
 * Компонент вкладок панели БД
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладок
 */
export function DatabaseTabs(props: DatabaseTabsProps): React.JSX.Element {
  const { isMobile, ...restProps } = props;

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-2 flex-shrink-0 m-3 sm:m-4">
        <TabsTrigger value="users">Пользователи</TabsTrigger>
        <TabsTrigger value="responses">Ответы пользователей</TabsTrigger>
      </TabsList>

      <UsersTabContent isMobile={isMobile} {...restProps} />
      <ResponsesTabContent users={restProps.filteredAndSortedUsers} />
    </Tabs>
  );
}
