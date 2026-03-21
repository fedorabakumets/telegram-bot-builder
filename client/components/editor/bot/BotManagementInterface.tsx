/**
 * @fileoverview Интерфейс управления ботами
 *
 * Отображает список проектов с их ботами.
 * Все данные редактирования и мутации берёт из BotControlContext.
 *
 * @module BotManagementInterface
 */

import { ProjectHeader } from './ProjectHeader';
import { EmptyBotsState } from './EmptyBotsState';
import { ProjectBotsList } from './ProjectBotsList';
import { useBotControl } from './bot-control-context';
import type { BotProject, BotToken } from '@shared/schema';

/**
 * Свойства интерфейса управления ботами
 */
interface BotManagementInterfaceProps {
  /** Список проектов */
  projects: BotProject[];
  /** Токены по каждому проекту (индекс совпадает с projects) */
  allTokens: BotToken[][];
}

/**
 * Интерфейс управления ботами
 */
export function BotManagementInterface({ projects, allTokens }: BotManagementInterfaceProps) {
  const { setProjectForNewBot, setShowAddBot, allBotInfos } = useBotControl();

  return (
    <div className="space-y-8">
      {projects.map((project, projectIndex) => {
        const projectTokens = allTokens[projectIndex] || [];
        const projectBotInfo = allBotInfos[projectIndex];

        return (
          <div key={project.id} className="space-y-4">
            <ProjectHeader
              projectName={project.name}
              botsCount={projectTokens.length}
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
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
