/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Переключатель генерации комментариев
 * - Таймер выполнения
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotCommentsToggle } from './BotCommentsToggle';
import { BotExecutionTimer } from './BotExecutionTimer';

interface BotSettingsGridProps {
  projectId: number;
  tokenId: number;
  userDatabaseEnabled: number | null;
  commentsGenerationEnabled: boolean;
  isBotRunning: boolean;
  currentElapsedSeconds: Record<number, number>;
  allBotStatuses: any[];
  toggleDatabaseMutation: any;
  handleToggleCommentsGeneration: (enabled: boolean) => void;
}

/**
 * Сетка настроек бота
 */
export function BotSettingsGrid({
  projectId,
  tokenId,
  userDatabaseEnabled,
  commentsGenerationEnabled,
  isBotRunning,
  currentElapsedSeconds,
  allBotStatuses,
  toggleDatabaseMutation,
  handleToggleCommentsGeneration
}: BotSettingsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <BotDatabaseToggle
        projectId={projectId}
        tokenId={tokenId}
        userDatabaseEnabled={userDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
      />
      <BotCommentsToggle
        commentsGenerationEnabled={commentsGenerationEnabled}
        handleToggleCommentsGeneration={handleToggleCommentsGeneration}
      />
      {isBotRunning && (
        <BotExecutionTimer
          tokenId={tokenId}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
        />
      )}
    </div>
  );
}
