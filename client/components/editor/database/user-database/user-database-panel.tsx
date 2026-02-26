/**
 * @fileoverview Главный компонент панели базы данных пользователей
 * @description Компонент верхнего уровня, объединяющий все подкомпоненты
 */

import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { UserDatabasePanelProps } from './types';
import { RefreshCw } from 'lucide-react';
import { DatabaseContent } from './database-content';
import { useUserDatabasePanelState } from './panel/panel-state';
import { useUserDatabasePanelData, useUserDatabasePanelMutations } from './panel/panel-hooks';
import { useVariableToQuestionMap, useFilteredAndSortedUsers } from './panel/panel-memo';
import { useUserDatabasePanelHandlers } from './panel/panel-handlers';
import { useResponsive } from './hooks/use-responsive';
import { formatUserName } from './utils';

/**
 * Компонент панели базы данных пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент панели
 */
export function UserDatabasePanel(props: UserDatabasePanelProps): React.JSX.Element {
  const { projectId, projectName, onOpenDialogPanel, onOpenUserDetailsPanel } = props;

  // Хук адаптивности
  const { containerRef, width, height, breakpoint, visibleColumns, statsColumns } = useResponsive();

  // Хук состояния
  const { state, setters } = useUserDatabasePanelState();
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
    isLoading,
    refetchUsers,
    refetchStats,
  } = useUserDatabasePanelData({
    projectId,
    searchQuery,
  });

  // Хук мутаций
  const {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
  } = useUserDatabasePanelMutations({
    projectId,
    refetchUsers,
    refetchStats,
  });

  // Memo хуки
  const variableToQuestionMap = useVariableToQuestionMap({
    projectData: project?.data,
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
  const { handleUserStatusToggle } =
    useUserDatabasePanelHandlers(
      { updateUserMutation, toast },
      undefined
    );

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
    <div ref={containerRef} className="h-full w-full flex flex-col">
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
        onOpenDialogPanel={onOpenDialogPanel}
        handleUserStatusToggle={handleUserStatusToggle}
        deleteUserMutation={deleteUserMutation}
        project={project}
        variableToQuestionMap={variableToQuestionMap}
        panelDimensions={{ width, height, breakpoint }}
        visibleColumns={visibleColumns}
        statsColumns={statsColumns}
      />
    </div>
  );
}
