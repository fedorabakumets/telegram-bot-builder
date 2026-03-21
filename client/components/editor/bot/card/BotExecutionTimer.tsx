/**
 * @fileoverview Таймер выполнения бота
 *
 * Компонент отображает время работы запущенного бота.
 *
 * @module BotExecutionTimer
 */

import { Clock } from 'lucide-react';
import { formatExecutionTime } from '../contexts/bot-control-utils';
import type { BotStatusResponse } from '../bot-types';

/**
 * Свойства таймера выполнения бота
 */
interface BotExecutionTimerProps {
  /** ID токена бота */
  tokenId: number;
  /** Текущее время работы ботов в секундах (ключ — tokenId) */
  currentElapsedSeconds: Record<number, number>;
  /** Статусы всех ботов */
  allBotStatuses: BotStatusResponse[];
}

/**
 * Таймер выполнения бота
 */
export function BotExecutionTimer({
  tokenId,
  currentElapsedSeconds,
  allBotStatuses,
}: BotExecutionTimerProps) {
  const botStatus = allBotStatuses.find(s => s.instance?.tokenId === tokenId);
  return (
    <div className="sm:col-span-2 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-gradient-to-r from-amber-500/8 to-orange-500/8 border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/40" data-testid="timer-display-bot-card">
      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">Запущен</p>
        <p className="text-sm sm:text-base font-mono font-bold text-amber-600 dark:text-amber-300">
          {botStatus?.instance?.startedAt
            ? formatExecutionTime(Math.max(
                Math.floor((Date.now() - new Date(botStatus.instance.startedAt).getTime()) / 1000),
                currentElapsedSeconds[tokenId] || 0,
              ))
            : formatExecutionTime(currentElapsedSeconds[tokenId] || 0)
          }
        </p>
      </div>
    </div>
  );
}
