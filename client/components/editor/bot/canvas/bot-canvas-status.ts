/**
 * @fileoverview Статус карточки бота на холсте: онлайн, офлайн или мёртвый токен.
 * @module bot/canvas/bot-canvas-status
 */

import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';

/** Статус, который видит пользователь на карточке и в шапке */
export type BotCanvasStatus = 'online' | 'offline' | 'unknown' | 'inactive' | 'invalid' | 'frozen_running' | 'frozen_stopped' | 'frozen_unknown' | 'failed' | 'error' | 'starting' | 'stopping' | 'restarting';

/** Входные данные для статуса */
export interface BotCanvasStatusInput {
  /** Исполнитель не подтвердил состояние процесса. */
  unknown?: boolean;
  /** Telegram подтвердил ограничение бота */
  frozen?: boolean;
  /** Подтверждённая Telegram ошибка авторизации, отдельно от ручного отключения */
  authorizationError?: string | null;
  /** Флаг активности токена (0 — отключён) */
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
  /** Остановка процесса остаётся видимой даже при ограничении Telegram или отключённом токене. */
  if (input.operation === 'stopping') return 'stopping';
  if (input.authorizationError === 'unauthorized') return 'invalid';
  if (input.frozen) {
    if (input.unknown) return 'frozen_unknown';
    return input.isRunning ? 'frozen_running' : 'frozen_stopped';
  }
  if (!isTokenActiveForBroadcast(input.isActive)) return 'inactive';
  if (input.operation) return input.operation;
  if (input.unknown) return 'unknown';
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
  if (status === 'unknown') return 'Нет связи';
  if (status === 'frozen_running') return 'Заморожен · ожидается автоостановка';
  if (status === 'frozen_stopped') return 'Заморожен · процесс остановлен';
  if (status === 'frozen_unknown') return 'Заморожен · состояние процесса неизвестно';
  if (status === 'starting') return 'Запускается…';
  if (status === 'stopping') return 'Останавливается…';
  if (status === 'restarting') return 'Перезапускается…';
  if (status === 'error') return 'Ошибка операции';
  if (status === 'online') return 'Онлайн';
  if (status === 'invalid') return 'Недействительный токен';
  if (status === 'inactive') return 'Отключён';
  if (status === 'failed') return 'Запуск с ошибкой';
  return 'Офлайн';
}

/**
 * Отделяет ограничение Telegram от жизненного цикла процесса.
 * @param status - Визуальный статус
 * @returns Признак любой комбинации заморозки и состояния процесса
 */
export function isFrozenCanvasStatus(status: BotCanvasStatus): boolean {
  return status === 'frozen_running' || status === 'frozen_stopped' || status === 'frozen_unknown';
}
