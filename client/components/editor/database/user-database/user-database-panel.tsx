/**
 * @fileoverview Главный компонент панели базы данных пользователей
 * @description Компонент верхнего уровня, объединяющий все подкомпоненты
 */

import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { UserDatabasePanelProps } from './types';
import { RefreshCw } from 'lucide-react';
import { MessageDialog } from './components/dialog';
import { UserDetailsDialog } from './components/details';
import { DatabaseContent } from './database-content';
import { useUserDatabasePanelState } from './panel/panel-state';
import { useUserDatabasePanelData, useUserDatabasePanelMutations } from './panel/panel-hooks';
import { useVariableToQuestionMap, useUserMessageCounts, useFilteredAndSortedUsers } from './panel/panel-memo';
import { useUserDatabasePanelHandlers } from './panel/panel-handlers';
import { useEffect } from 'react';

/**
 * Компонент панели базы данных пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент панели
 */
export function UserDatabasePanel(props: UserDatabasePanelProps): React.JSX.Element {
  const { projectId, projectName, onOpenDialogPanel, onOpenUserDetailsPanel } = props;

  // Хук состояния
  const { state, setters, messagesScrollRef } = useUserDatabasePanelState();
  const {
    searchQuery,
    selectedUser,
    showUserDetails,
    sortField,
    sortDirection,
    filterActive,
    filterPremium,
    showDialog,
    selectedUserForDialog,
    messageText,
  } = state;
  const {
    setSearchQuery,
    setSelectedUser,
    setShowUserDetails,
    setSortField,
    setSortDirection,
    setFilterActive,
    setFilterPremium,
    setShowDialog,
    setSelectedUserForDialog,
    setMessageText,
  } = setters;

  // Хук мобильного режима
  const isMobile = useIsMobile();

  // Хук уведомлений
  const { toast } = useToast();

  // Хук данных
  const {
    project,
    users,
    stats,
    searchResults,
    messages,
    userDetailsMessages,
    isLoading,
    isMessagesLoading,
    refetchUsers,
    refetchStats,
    refetchMessages,
  } = useUserDatabasePanelData({
    projectId,
    searchQuery,
    showDialog,
    showUserDetails,
    selectedUserForDialogUserId: selectedUserForDialog?.userId,
    selectedUserId: selectedUser?.userId,
  });

  // Хук мутаций
  const {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
    sendMessageMutation,
  } = useUserDatabasePanelMutations({
    projectId,
    refetchUsers,
    refetchStats,
  });

  // Memo хуки
  const variableToQuestionMap = useVariableToQuestionMap({
    projectData: project?.data,
  });

  const userMessageCounts = useUserMessageCounts({
    userDetailsMessages,
  });

  const filteredAndSortedUsers = useFilteredAndSortedUsers({
    users,
    searchResults,
    searchQuery,
    filterActive,
    filterPremium,
    filterBlocked: null,
    sortField,
    sortDirection,
  });

  // Обработчики
  const { handleUserStatusToggle, scrollToBottom, getPhotoUrlFromMessages } =
    useUserDatabasePanelHandlers(
      { updateUserMutation, toast, messagesScrollRef },
      userDetailsMessages
    );

  // Auto-scroll при изменении сообщений
  useEffect(() => {
    if (showDialog && !isMessagesLoading) {
      scrollToBottom();
    }
  }, [showDialog, isMessagesLoading, selectedUserForDialog?.userId]);

  // Refetch сообщений при открытии диалога
  useEffect(() => {
    if (showDialog && selectedUserForDialog?.userId) {
      refetchMessages();
    }
  }, [showDialog, selectedUserForDialog?.userId, refetchMessages]);

  // Показчик загрузки
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Загрузка базы данных...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DatabaseContent
        projectId={projectId}
        projectName={projectName}
        isDatabaseEnabled={project?.userDatabaseEnabled === 1}
        toggleDatabaseMutation={toggleDatabaseMutation}
        handleRefresh={() => {
          refetchUsers();
          refetchStats();
        }}
        deleteAllUsersMutation={deleteAllUsersMutation}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        filterPremium={filterPremium}
        setFilterPremium={setFilterPremium}
        sortField={sortField}
        sortDirection={sortDirection}
        setSortField={setSortField}
        setSortDirection={setSortDirection}
        isMobile={isMobile}
        filteredAndSortedUsers={filteredAndSortedUsers}
        formatUserName={formatUserName}
        onOpenUserDetailsPanel={onOpenUserDetailsPanel}
        setSelectedUser={setSelectedUser}
        setShowUserDetails={setShowUserDetails}
        onOpenDialogPanel={onOpenDialogPanel}
        setSelectedUserForDialog={setSelectedUserForDialog}
        setShowDialog={setShowDialog}
        scrollToBottom={scrollToBottom}
        handleUserStatusToggle={handleUserStatusToggle}
        deleteUserMutation={deleteUserMutation}
        project={project}
      />

      <UserDetailsDialog
        open={showUserDetails}
        onOpenChange={setShowUserDetails}
        selectedUser={selectedUser}
        userMessageCounts={userMessageCounts}
        handleUserStatusToggle={handleUserStatusToggle}
        variableToQuestionMap={variableToQuestionMap}
        getPhotoUrlFromMessages={getPhotoUrlFromMessages}
      />

      <MessageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedUser={selectedUserForDialog}
        formatUserName={formatUserName}
        messagesScrollRef={messagesScrollRef}
        isMessagesLoading={isMessagesLoading}
        messages={messages}
        messageText={messageText}
        setMessageText={setMessageText}
        isSending={sendMessageMutation.isPending}
        sendMessage={(text) => {
          if (selectedUserForDialog?.userId) {
            sendMessageMutation.mutate({
              messageText: text,
              userId: selectedUserForDialog.userId,
            });
          }
        }}
      />
    </>
  );
}

/**
 * Функция форматирования имени пользователя
 * @param user - Данные пользователя
 * @returns Отформатированное имя
 */
function formatUserName(user: UserBotData): string {
  const firstName = user.firstName;
  const lastName = user.lastName;
  const userName = user.userName;
  const userId = user.userId;

  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (userName) return `@${userName}`;
  return `ID: ${userId}`;
}
