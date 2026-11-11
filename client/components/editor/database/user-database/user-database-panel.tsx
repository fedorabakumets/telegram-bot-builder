/**
 * @fileoverview Главный компонент панели базы данных пользователей
 * @description Компонент верхнего уровня, объединяющий все подкомпоненты
 */
import { usePanelToken } from './panel/use-panel-token';
import { useToast } from '@/hooks/use-toast';
import { DatabaseContent } from './database-content';
import { useResponsive } from './hooks/use-responsive';
import { useUserDatabasePanelData, useUserDatabasePanelMutations } from './panel/panel-hooks';
import { useUserDatabasePanelHandlers } from './panel/panel-handlers';
import { useVariableToQuestionMap, useFilteredAndSortedUsers } from './panel/panel-memo';
import { useUserDatabasePanelState } from './panel/panel-state';
import { UserDatabasePanelProps } from './types';
import { formatUserName } from './utils';
import { LiveInvalidator } from './panel/live-invalidator';
/**
 * Компонент панели базы данных пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент панели
 */
export function UserDatabasePanel(props: UserDatabasePanelProps): React.JSX.Element {
  const {
    projectId,
    projectName,
    onOpenDialogPanel,
    onOpenUserDetailsPanel,
    onNavigateToDialog,
    allProjects,
    onProjectChange,
  } = props;
  const { containerRef, visibleColumns, width } = useResponsive();
  const { projectTokens, resolvedSelectedTokenId, handleSelectToken } = usePanelToken(props);
  const { state, setters } = useUserDatabasePanelState();
  const isMobile = width < 960;
  const { toast } = useToast();
  const {
    searchQuery,
    sortField,
    sortDirection,
    filterActive,
    filterPremium,
  } = state;
  const {
    setSearchQuery,
    setSortField,
    setSortDirection,
    setFilterActive,
    setFilterPremium,
  } = setters;
  const {
    project,
    users,
    stats,
    usersError,
    isUsersPending,
    refetchUsers,
    refetchStats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserDatabasePanelData({
    projectId,
    selectedTokenId: resolvedSelectedTokenId,
    searchQuery,
    filterActive,
    sortField,
    sortDirection,
  });
  const {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
  } = useUserDatabasePanelMutations({
    projectId,
    selectedTokenId: resolvedSelectedTokenId,
    refetchUsers,
    refetchStats,
  });
  const variableToQuestionMap = useVariableToQuestionMap({
    projectData: project?.data,
  });
  const filteredAndSortedUsers = useFilteredAndSortedUsers({
    users,
    filterActive,
    filterPremium,
    filterBlocked: null,
  });
  const { handleUserStatusToggle } = useUserDatabasePanelHandlers(
    { updateUserMutation, toast },
    undefined
  );
  /** Флаг сохранения медиафайлов для выбранного токена */
  const selectedToken = projectTokens.find((t) => t.id === resolvedSelectedTokenId);
  const saveIncomingMedia = selectedToken?.saveIncomingMedia ?? 0;
  return (
    <>
      <LiveInvalidator projectId={projectId} selectedTokenId={resolvedSelectedTokenId} />
      <div ref={containerRef} className="flex h-full w-full flex-col">
        <DatabaseContent
        usersError={usersError}
        isUsersPending={isUsersPending}
        projectId={projectId}
        projectName={projectName}
        selectedTokenId={resolvedSelectedTokenId}
        availableTokens={projectTokens}
        onSelectToken={handleSelectToken}
        isDatabaseEnabled={project ? project.userDatabaseEnabled === 1 : true}
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
        onOpenDialogPanel={onOpenDialogPanel}
        onNavigateToDialog={onNavigateToDialog}
        handleUserStatusToggle={handleUserStatusToggle}
        deleteUserMutation={deleteUserMutation}
        project={project}
        variableToQuestionMap={variableToQuestionMap}
        visibleColumns={visibleColumns}
        allProjects={allProjects}
        onProjectChange={onProjectChange}
        saveIncomingMedia={saveIncomingMedia}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </>
  );
}
