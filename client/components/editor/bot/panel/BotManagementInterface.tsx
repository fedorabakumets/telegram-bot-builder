/**
 * @fileoverview Интерфейс управления ботами
 *
 * Отображает список проектов с их ботами или холст активного проекта.
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

    const canvasTokens = activeEntry.tokens;
    const canvasOfflineCount = canvasTokens.filter((t) => {
      const st = allBotStatuses.find((s) => s.tokenId === t.id);
      return st?.status !== 'running';
    }).length;
    const canvasStarting =
      startOfflineAllMutation.isPending
      && startOfflineAllMutation.variables === activeEntry.project.id;

    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6">
        <ProjectHeader
          projectId={activeEntry.project.id}
          projectName={activeEntry.project.name}
          botsCount={canvasTokens.length}
          onRestartAll={() => restartAllBotsMutation.mutate(activeEntry.project.id)}
          isRestartingAll={restartAllBotsMutation.isPending}
          offlineCount={canvasOfflineCount}
          onStartOfflineAll={() => startOfflineAllMutation.mutate(activeEntry.project.id)}
          isStartingOffline={canvasStarting}
        />
        <div className="min-h-0 flex-1">
          <BotsCanvasWorkspace project={activeEntry.project} tokens={canvasTokens} />
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
            />
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
