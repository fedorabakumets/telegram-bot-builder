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
    setSelectedUser,
    setShowUserDetails,
    onOpenDialogPanel,
    setSelectedUserForDialog,
    setShowDialog,
    scrollToBottom,
    handleUserStatusToggle,
    deleteUserMutation,
  } = props;

  return (
    <TabsContent value="users" className="mt-2">
      {isMobile ? (
        <MobileUserList
          users={filteredAndSortedUsers}
          searchQuery={searchQuery}
          formatUserName={formatUserName}
          onOpenUserDetailsPanel={onOpenUserDetailsPanel}
          onOpenDialogPanel={onOpenDialogPanel}
          handleUserStatusToggle={handleUserStatusToggle}
          setSelectedUser={setSelectedUser}
          setShowUserDetails={setShowUserDetails}
          setSelectedUserForDialog={setSelectedUserForDialog}
          setShowDialog={setShowDialog}
          scrollToBottom={scrollToBottom}
        />
      ) : (
        <DesktopTable
          users={filteredAndSortedUsers}
          searchQuery={searchQuery}
          formatUserName={formatUserName}
          onOpenUserDetailsPanel={onOpenUserDetailsPanel}
          onOpenDialogPanel={onOpenDialogPanel}
          handleUserStatusToggle={handleUserStatusToggle}
          setSelectedUser={setSelectedUser}
          setShowUserDetails={setShowUserDetails}
          setSelectedUserForDialog={setSelectedUserForDialog}
          setShowDialog={setShowDialog}
          scrollToBottom={scrollToBottom}
          deleteUserMutation={deleteUserMutation}
        />
      )}
    </TabsContent>
  );
}
