/**
 * @fileoverview Таймер выполнения бота
 *
 * Компонент отображает время работы запущенного бота.
 *
 * @module BotExecutionTimer
 */

import { Clock } from 'lucide-react';
import { formatExecutionTime } from './bot-control-utils';

interface BotExecutionTimerProps {
  tokenId: number;
  currentElapsedSeconds: Record<number, number>;
  allBotStatuses: any[];
}

/**
 * Таймер выполнения бота
 */
export function BotExecutionTimer({
  tokenId,
  currentElapsedSeconds,
  allBotStatuses
}: BotExecutionTimerProps) {
  return (
    <div className="sm:col-span-2 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-gradient-to-r from-amber-500/8 to-orange-500/8 border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/40" data-testid="timer-display-bot-card">
      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">Запущен</p>
        <p className="text-sm sm:text-base font-mono font-bold text-amber-600 dark:text-amber-300">
          {(() => {
            const botStatus = allBotStatuses.find(s => s.instance && s.instance.tokenId === tokenId);
            if (botStatus && botStatus.instance?.startedAt) {
              const elapsedSeconds = Math.floor((Date.now() - new Date(botStatus.instance.startedAt).getTime()) / 1000);
              return formatExecutionTime(Math.max(elapsedSeconds, currentElapsedSeconds[tokenId] || 0));
            }
            return formatExecutionTime(currentElapsedSeconds[tokenId] || 0);
          })()}
        </p>
      </div>
    </div>
  );
}
