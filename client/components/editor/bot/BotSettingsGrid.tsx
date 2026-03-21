/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Переключатель базы данных
 * - Таймер выполнения
 *
 * @module BotSettingsGrid
 */

import { BotDatabaseToggle } from './BotDatabaseToggle';
import { BotExecutionTimer } from './BotExecutionTimer';
import { BotAdminIds } from './BotAdminIds';

interface BotSettingsGridProps {
  projectId: number;
  tokenId: number;
  userDatabaseEnabled: number | null;
  isBotRunning: boolean;
  currentElapsedSeconds: Record<number, number>;
  allBotStatuses: any[];
  toggleDatabaseMutation: any;
}

/**
 * Сетка настроек бота
 */
export function BotSettingsGrid({
  projectId,
  tokenId,
  userDatabaseEnabled,
  isBotRunning,
  currentElapsedSeconds,
  allBotStatuses,
  toggleDatabaseMutation
}: BotSettingsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <BotDatabaseToggle
        projectId={projectId}
        tokenId={tokenId}
        userDatabaseEnabled={userDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
      />
      {isBotRunning && (
        <BotExecutionTimer
          tokenId={tokenId}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
        />
      )}
      <BotAdminIds projectId={projectId} />
    </div>
  );
}
