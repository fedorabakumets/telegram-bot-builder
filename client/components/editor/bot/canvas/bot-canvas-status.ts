/**
 * @fileoverview Статус карточки бота на холсте: онлайн, офлайн или мёртвый токен.
 * @module bot/canvas/bot-canvas-status
 */

import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';

/** Статус, который видит пользователь на карточке и в шапке */
export type BotCanvasStatus = 'online' | 'offline' | 'invalid' | 'failed' | 'error' | 'starting' | 'stopping' | 'restarting';

/** Входные данные для статуса */
export interface BotCanvasStatusInput {
  /** Флаг isActive токена (0 — Telegram отклонил) */
  isActive?: number | null;
  /** Процесс бота запущен */
  isRunning: boolean;
  /** Есть ошибка последнего запуска */
  hasFailure?: boolean;
  /** Текущая операция управления процессом */
  operation?: 'starting' | 'stopping' | 'restarting' | null;
}

/**
 * Недействительный токен важнее «офлайн» и «ошибки запуска».
 * @param input - Флаги токена и процесса
 * @returns Статус для UI
 */
export function resolveBotCanvasStatus(input: BotCanvasStatusInput): BotCanvasStatus {
  if (!isTokenActiveForBroadcast(input.isActive)) return 'invalid';
  if (input.operation) return input.operation;
  if (input.isRunning) return 'online';
  if (input.hasFailure) return 'failed';
  return 'offline';
}

/**
 * Короткая подпись статуса.
 * @param status - Статус карточки
 * @returns Текст для бейджа
 */
export function botCanvasStatusLabel(status: BotCanvasStatus): string {
  if (status === 'starting') return 'Запускается…';
  if (status === 'stopping') return 'Останавливается…';
  if (status === 'restarting') return 'Перезапускается…';
  if (status === 'error') return 'Ошибка операции';
  if (status === 'online') return 'Онлайн';
  if (status === 'invalid') return 'Токен недействителен';
  if (status === 'failed') return 'Запуск с ошибкой';
  return 'Офлайн';
}
