/**
 * @fileoverview Интерфейс управления ботами
 *
 * Отображает список проектов с их ботами или холст активного проекта.
 * Bulk-кнопки текущего проекта — в TabHeader (BotControlPanelHeader).
 *
 * @module BotManagementInterface
 */

import { useState } from 'react';
import { ProjectHeader } from '../project/ProjectHeader';
import { EmptyBotsState } from './EmptyBotsState';
import { ProjectBotsList } from '../project/ProjectBotsList';
import { useBotControl } from '../bot-control-context';
import { BotsCanvasWorkspace } from '../canvas/BotsCanvasWorkspace';
import type { BotViewMode } from '../canvas/use-bot-view-mode';
import type { BotProject, BotToken } from '@shared/schema';

/** Свойства интерфейса управления ботами */
interface BotManagementInterfaceProps {
  /** Список проектов */
  projects: BotProject[];
  /** Токены по каждому проекту */
  allTokens: BotToken[][];
  /** ID активного проекта */
  currentProjectId?: number;
  /** Режим Список / Холст */
  viewMode?: BotViewMode;
}

/**
 * Интерфейс управления ботами
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotManagementInterface({
  projects,
  allTokens,
  currentProjectId,
  viewMode = 'list',
}: BotManagementInterfaceProps) {
  const {
    setProjectForNewBot,
    setShowAddBot,
    allBotInfos,
    allBotStatuses,
    restartAllBotsMutation,
    startOfflineAllMutation,
  } = useBotControl();
  const [collapsedState, setCollapsedState] = useState<Record<number, boolean>>({});

  const sortedEntries = projects
    .map((project, index) => ({ project, tokens: allTokens[index] || [], botInfo: allBotInfos[index] }))
    .sort((a, b) => {
      if (a.project.id === currentProjectId) return -1;
      if (b.project.id === currentProjectId) return 1;
      return 0;
    });

  const activeEntry =
    sortedEntries.find((e) => e.project.id === currentProjectId) ?? sortedEntries[0];

  if (viewMode === 'canvas' && activeEntry) {
    if (activeEntry.tokens.length === 0) {
      return (
        <div className="h-full p-4 sm:p-6">
          <EmptyBotsState
            onAddBot={() => {
              setProjectForNewBot(activeEntry.project.id);
              setShowAddBot(true);
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col p-0 sm:p-0">
        <div className="min-h-0 flex-1">
          <BotsCanvasWorkspace project={activeEntry.project} tokens={activeEntry.tokens} />
        </div>
      </div>
    );
  }

  function handleCollapseChange(tokenId: number, collapsed: boolean) {
    setCollapsedState((prev) => ({ ...prev, [tokenId]: collapsed }));
  }

  function handleCollapseAll(tokens: BotToken[]) {
    setCollapsedState((prev) => {
      const next = { ...prev };
      tokens.forEach((t) => { next[t.id] = true; });
      return next;
    });
  }

  function handleExpandAll(tokens: BotToken[]) {
    setCollapsedState((prev) => {
      const next = { ...prev };
      tokens.forEach((t) => { next[t.id] = false; });
      return next;
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {sortedEntries.map(({ project, tokens: projectTokens, botInfo: projectBotInfo }) => {
        const isCurrent = project.id === currentProjectId;
        const defaultCollapsedFallback = projectTokens.length > 3;
        const allCollapsed = projectTokens.length > 0 && projectTokens.every((t) => {
          const val = collapsedState[t.id];
          return val === undefined ? defaultCollapsedFallback : val;
        });

        const offlineCount = projectTokens.filter((t) => {
          const st = allBotStatuses.find((s) => s.tokenId === t.id);
          return st?.status !== 'running';
        }).length;
        const startingThis =
          startOfflineAllMutation.isPending
          && startOfflineAllMutation.variables === project.id;

        return (
          <div key={project.id} className="space-y-4">
            {!isCurrent && (
              <ProjectHeader
                projectId={project.id}
                projectName={project.name}
                botsCount={projectTokens.length}
                allCollapsed={allCollapsed}
                onCollapseAll={() => handleCollapseAll(projectTokens)}
                onExpandAll={() => handleExpandAll(projectTokens)}
                onRestartAll={() => restartAllBotsMutation.mutate(project.id)}
                isRestartingAll={restartAllBotsMutation.isPending}
                offlineCount={offlineCount}
                onStartOfflineAll={() => startOfflineAllMutation.mutate(project.id)}
                isStartingOffline={startingThis}
                showBulkActions
              />
            )}
            {isCurrent && projectTokens.length > 1 && (
              <ProjectHeader
                projectId={project.id}
                projectName={project.name}
                botsCount={projectTokens.length}
                allCollapsed={allCollapsed}
                onCollapseAll={() => handleCollapseAll(projectTokens)}
                onExpandAll={() => handleExpandAll(projectTokens)}
                showBulkActions={false}
                hideTitle
              />
            )}
            {projectTokens.length === 0 ? (
              <EmptyBotsState
                onAddBot={() => {
                  setProjectForNewBot(project.id);
                  setShowAddBot(true);
                }}
              />
            ) : (
              <ProjectBotsList
                project={project}
                projectTokens={projectTokens}
                projectBotInfo={projectBotInfo}
                collapsedState={collapsedState}
                onCollapseChange={handleCollapseChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
