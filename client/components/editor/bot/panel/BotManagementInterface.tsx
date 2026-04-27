/**
 * @fileoverview Интерфейс управления ботами
 *
 * Отображает список проектов с их ботами.
 * Хранит состояние сворачивания карточек по tokenId.
 * Передаёт колбэки сворачивания в ProjectHeader и ProjectBotsList.
 *
 * @module BotManagementInterface
 */

import { useState } from 'react';
import { ProjectHeader } from '../project/ProjectHeader';
import { EmptyBotsState } from './EmptyBotsState';
import { ProjectBotsList } from '../project/ProjectBotsList';
import { useBotControl } from '../bot-control-context';
import type { BotProject, BotToken } from '@shared/schema';

/** Свойства интерфейса управления ботами */
interface BotManagementInterfaceProps {
  /** Список проектов */
  projects: BotProject[];
  /** Токены по каждому проекту (индекс совпадает с projects) */
  allTokens: BotToken[][];
}

/**
 * Интерфейс управления ботами
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotManagementInterface({ projects, allTokens }: BotManagementInterfaceProps) {
  const { setProjectForNewBot, setShowAddBot, allBotInfos } = useBotControl();

  /** Состояние сворачивания карточек: tokenId → collapsed */
  const [collapsedState, setCollapsedState] = useState<Record<number, boolean>>({});

  /**
   * Обновить состояние сворачивания одного токена
   * @param tokenId - ID токена
   * @param collapsed - Новое состояние
   */
  function handleCollapseChange(tokenId: number, collapsed: boolean) {
    setCollapsedState(prev => ({ ...prev, [tokenId]: collapsed }));
  }

  /**
   * Свернуть все карточки проекта
   * @param tokens - Токены проекта
   */
  function handleCollapseAll(tokens: BotToken[]) {
    setCollapsedState(prev => {
      const next = { ...prev };
      tokens.forEach(t => { next[t.id] = true; });
      return next;
    });
  }

  /**
   * Развернуть все карточки проекта
   * @param tokens - Токены проекта
   */
  function handleExpandAll(tokens: BotToken[]) {
    setCollapsedState(prev => {
      const next = { ...prev };
      tokens.forEach(t => { next[t.id] = false; });
      return next;
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {projects.map((project, projectIndex) => {
        const projectTokens = allTokens[projectIndex] || [];
        const projectBotInfo = allBotInfos[projectIndex];

        /** Все ли карточки проекта свёрнуты */
        const defaultCollapsedFallback = projectTokens.length > 3;
        const allCollapsed = projectTokens.length > 0 && projectTokens.every(t => {
          const val = collapsedState[t.id];
          return val === undefined ? defaultCollapsedFallback : val;
        });

        return (
          <div key={project.id} className="space-y-4">
            <ProjectHeader
              projectName={project.name}
              botsCount={projectTokens.length}
              allCollapsed={allCollapsed}
              onCollapseAll={() => handleCollapseAll(projectTokens)}
              onExpandAll={() => handleExpandAll(projectTokens)}
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
