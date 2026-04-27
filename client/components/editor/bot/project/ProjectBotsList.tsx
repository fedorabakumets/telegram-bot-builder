/**
 * @fileoverview Список ботов проекта
 *
 * Отображает карточки всех ботов в проекте.
 * Если токенов больше 3 — карточки свёрнуты по умолчанию.
 * Принимает внешнее состояние сворачивания для синхронизации с родителем.
 *
 * @module ProjectBotsList
 */

import { BotCard } from '../card/BotCard';
import { useBotControl } from '../bot-control-context';
import type { BotProject, BotToken } from '@shared/schema';
import type { BotInfo } from '../profile/BotProfileEditor';

/** Свойства списка ботов проекта */
interface ProjectBotsListProps {
  /** Проект */
  project: BotProject;
  /** Токены проекта */
  projectTokens: BotToken[];
  /** Информация о боте из Telegram API */
  projectBotInfo: BotInfo | undefined;
  /** Внешнее состояние сворачивания по tokenId */
  collapsedState?: Record<number, boolean>;
  /** Колбэк при изменении состояния сворачивания конкретного токена */
  onCollapseChange?: (tokenId: number, collapsed: boolean) => void;
}

/**
 * Список ботов проекта
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectBotsList({
  project, projectTokens, projectBotInfo, collapsedState, onCollapseChange,
}: ProjectBotsListProps) {
  const { allBotStatuses } = useBotControl();

  /** По умолчанию сворачиваем если ботов больше 3 */
  const defaultCollapsedFallback = projectTokens.length > 3;

  return (
    <div className="grid gap-4">
      {projectTokens.map((token) => {
        const tokenStatus = allBotStatuses.find(
          s => s.tokenId === token.id || s.instance?.tokenId === token.id,
        );
        const isThisTokenRunning = tokenStatus?.status === 'running';

        /** Определяем defaultCollapsed: из внешнего состояния или по умолчанию */
        const defaultCollapsed = collapsedState
          ? (collapsedState[token.id] ?? defaultCollapsedFallback)
          : defaultCollapsedFallback;

        return (
          <BotCard
            key={token.id}
            token={token}
            project={project}
            projectBotInfo={projectBotInfo}
            isThisTokenRunning={isThisTokenRunning}
            defaultCollapsed={defaultCollapsed}
            onCollapseChange={(collapsed) => onCollapseChange?.(token.id, collapsed)}
          />
        );
      })}
    </div>
  );
}
