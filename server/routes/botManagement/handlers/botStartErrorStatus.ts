/**
 * @fileoverview Определение HTTP-статуса ошибки запуска бота
 * @module botManagement/handlers/botStartErrorStatus
 */
import { BOT_LOCK_BUSY_ERROR } from '../../../bots/waitForBotRedisLock';

/**
 * Возвращает статус конфликта для занятой блокировки и ошибку сервера для остальных сбоев.
 * @param error - Сообщение об ошибке запуска
 * @returns HTTP-статус ответа
 */
export function botStartErrorStatus(error: string | undefined): number {
  return error === BOT_LOCK_BUSY_ERROR ? 409 : 500;
}
