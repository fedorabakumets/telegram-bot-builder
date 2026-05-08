/**
 * @fileoverview Главный компонент панели базы данных пользователей
 * @description Компонент верхнего уровня, объединяющий все подкомпоненты
 */

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useToast } from '@/hooks/use-toast';
import { DatabaseContent } from './database-content';
import { useResponsive } from './hooks/use-responsive';
import { useUserDatabasePanelData, useUserDatabasePanelMutations } from './panel/panel-hooks';
import { useUserDatabasePanelHandlers } from './panel/panel-handlers';
import { useVariableToQuestionMap, useFilteredAndSortedUsers } from './panel/panel-memo';
import { useUserDatabasePanelState } from './panel/panel-state';
import { UserDatabasePanelProps } from './types';
import { formatUserName } from './utils';
import { useLiveInvalidate } from './hooks/use-live-invalidate';
import { useTraffic } from './hooks/queries/use-traffic';

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
    selectedTokenId: selectedTokenIdProp,
    availableTokens: availableTokensProp,
    onSelectToken,
    allProjects,
    onProjectChange,
  } = props;

  const { containerRef, visibleColumns } = useResponsive();
  const projectTokensInfo = useProjectTokens([projectId]);
  const projectTokens = availableTokensProp ?? projectTokensInfo[0]?.tokens ?? [];
  const [internalSelectedTokenId, setInternalSelectedTokenId] = useState<number | null>(
    selectedTokenIdProp ?? null
  );
  const resolvedSelectedTokenId = selectedTokenIdProp ?? internalSelectedTokenId;
  const { state, setters } = useUserDatabasePanelState();  const isMobile = useIsMobile();
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
    isLoading,
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

  useEffect(() => {
    if (selectedTokenIdProp !== undefined) {
      setInternalSelectedTokenId(selectedTokenIdProp ?? null);
    }
  }, [selectedTokenIdProp]);

  useEffect(() => {
    if (projectTokens.length === 0) {
      return;
    }

    const hasSelectedToken = projectTokens.some((token) => token.id === resolvedSelectedTokenId);
    if (hasSelectedToken) {
      return;
    }

    const nextToken = projectTokens.find((token) => token.isDefault === 1) ?? projectTokens[0];
    if (selectedTokenIdProp === undefined) {
      setInternalSelectedTokenId(nextToken?.id ?? null);
    }
    onSelectToken?.(nextToken?.id ?? null);
  }, [onSelectToken, projectTokens, resolvedSelectedTokenId, selectedTokenIdProp]);

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

  /**
   * Обновляет выбранный токен локально и снаружи
   * @param tokenId - Новый идентификатор токена
   */
  function handleSelectToken(tokenId: number | null): void {
    if (selectedTokenIdProp === undefined) {
      setInternalSelectedTokenId(tokenId);
    }

    onSelectToken?.(tokenId);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Загрузка базы данных...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LiveInvalidator projectId={projectId} selectedTokenId={resolvedSelectedTokenId} />
      <div ref={containerRef} className="flex h-full w-full flex-col">
        <DatabaseContent
        projectId={projectId}
        projectName={projectName}
        selectedTokenId={resolvedSelectedTokenId}
        availableTokens={projectTokens}
        onSelectToken={handleSelectToken}
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

/**
 * Пропсы внутреннего компонента-инвалидатора
 */
interface LiveInvalidatorProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId: number | null;
}

/**
 * Вспомогательный компонент, вызывающий useLiveInvalidate внутри UserMessagesLiveProvider.
 * Также держит useTraffic смонтированным чтобы инвалидация кэша трафика работала
 * независимо от того, какой вид статистики выбран (дашборд или классика).
 * Рендерится без UI — только для подключения хуков к контексту провайдера.
 * @param props - Пропсы компонента
 * @returns null
 */
function LiveInvalidator({ projectId, selectedTokenId }: LiveInvalidatorProps): null {
  useLiveInvalidate({ projectId, selectedTokenId });
  // Держим useTraffic смонтированным всегда — иначе при классическом виде
  // StatsDashboard не рендерится и инвалидация не триггерит fetch
  useTraffic({ projectId, selectedTokenId });
  return null;
}
