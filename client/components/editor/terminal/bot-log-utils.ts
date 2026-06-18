/**
 * @fileoverview Преобразование записей bot_logs в строки терминала
 * @module terminal/bot-log-utils
 */

import type { BotLog } from '@shared/schema';
import type { TerminalLine } from './terminalTypes';

/**
 * Преобразует запись из таблицы bot_logs в строку терминала
 * @param log - Запись из БД
 * @returns Строка терминала с id = bot_logs.id
 */
export function botLogToTerminalLine(log: BotLog): TerminalLine {
  return {
    id: String(log.id),
    content: log.content,
    type: log.type === 'stderr' ? 'stderr' : 'stdout',
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
  };
}
