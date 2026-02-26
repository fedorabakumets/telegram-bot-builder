/**
 * @fileoverview Компонент вкладки пользователей
 * @description Отображает мобильный или desktop список пользователей
 */

import { TabsContent } from '@/components/ui/tabs';
import { MobileUserList } from '../components/mobile';
import { DesktopTable } from '../components/desktop';
import { DatabaseContentProps } from './database-content-props';

/**
 * Пропсы компонента UsersTabContent
 */
type UsersTabContentProps = Pick<
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
    onOpenUserDetailsPanel,
    onOpenDialogPanel,
    handleUserStatusToggle,
    deleteUserMutation,
    visibleColumns,
  } = props;

  return (
    <TabsContent value="users" className="mt-3 w-full block px-2 sm:px-3">
      <div className="p-2 sm:p-3 space-y-3 w-full">
        {isMobile ? (
          <MobileUserList
            users={filteredAndSortedUsers}
            searchQuery={searchQuery}
            formatUserName={formatUserName}
            onOpenUserDetailsPanel={onOpenUserDetailsPanel}
            onOpenDialogPanel={onOpenDialogPanel}
            handleUserStatusToggle={handleUserStatusToggle}
          />
        ) : (
          <DesktopTable
            users={filteredAndSortedUsers}
            searchQuery={searchQuery}
            formatUserName={formatUserName}
            onOpenUserDetailsPanel={onOpenUserDetailsPanel}
            onOpenDialogPanel={onOpenDialogPanel}
            handleUserStatusToggle={handleUserStatusToggle}
            deleteUserMutation={deleteUserMutation}
            visibleColumns={visibleColumns}
          />
        )}
      </div>
    </TabsContent>
  );
}
