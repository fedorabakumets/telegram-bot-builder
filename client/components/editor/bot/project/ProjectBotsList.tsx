/**
 * @fileoverview Список ботов проекта
 *
 * Отображает карточки всех ботов в проекте.
 * Данные редактирования и мутации берёт из BotControlContext.
 *
 * @module ProjectBotsList
 */

import { BotCard } from '../card/BotCard';
import { useBotControl } from '../bot-control-context';
import type { BotProject, BotToken } from '@shared/schema';
import type { BotInfo } from '../profile/BotProfileEditor';

/**
 * Свойства списка ботов проекта
 */
interface ProjectBotsListProps {
  /** Проект */
  project: BotProject;
  /** Токены проекта */
  projectTokens: BotToken[];
  /** Информация о боте из Telegram API */
  projectBotInfo: BotInfo | undefined;
}

/**
 * Список ботов проекта
 */
export function ProjectBotsList({ project, projectTokens, projectBotInfo }: ProjectBotsListProps) {
  const { allBotStatuses } = useBotControl();

  return (
    <div className="grid gap-4">
      {projectTokens.map((token) => {
        const tokenStatus = allBotStatuses.find(
          s => s.tokenId === token.id || s.instance?.tokenId === token.id,
        );
        const isThisTokenRunning = tokenStatus?.status === 'running';

        return (
          <BotCard
            key={token.id}
            token={token}
            project={project}
            projectBotInfo={projectBotInfo}
            isThisTokenRunning={isThisTokenRunning}
          />
        );
      })}
    </div>
  );
}
