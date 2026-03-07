/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Переключатель генерации комментариев
 * - Таймер выполнения
 * - Терминал бота
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotCommentsToggle } from './BotCommentsToggle';
import { BotExecutionTimer } from './BotExecutionTimer';
import { BotTerminal } from './BotTerminal';

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
      <div className="sm:col-span-2 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-gradient-to-r from-purple-500/8 to-indigo-500/8 border-purple-500/30 dark:from-purple-500/10 dark:to-indigo-500/10 dark:border-purple-500/40">
        <BotTerminal projectId={projectId} tokenId={tokenId} isBotRunning={isBotRunning} />
      </div>
    </div>
  );
}
