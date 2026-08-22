/**
 * @fileoverview Сохранение маркера __server_restart__ при обновлении статуса
 * @module server/bots/resolveStoppedErrorMessage
 */

import { SERVER_RESTART_MARKER } from './restoreSweepSelect';

/**
 * error_message для bot_instances при переводе в stopped.
 * Не затирает маркер деплоя строкой «Процесс завершен».
 *
 * @param currentErrorMessage - Текущее значение error_message
 * @param newStatus - Новый статус (running/stopped/error)
 * @returns Значение error_message для записи в БД
 */
export function resolveStoppedErrorMessage(
  currentErrorMessage: string | null | undefined,
  newStatus: string,
): string | null {
  if (newStatus === 'running') {
    return null;
  }
  if (newStatus === 'stopped') {
    if (currentErrorMessage === SERVER_RESTART_MARKER) {
      return SERVER_RESTART_MARKER;
    }
    return 'Процесс завершен';
  }
  return currentErrorMessage ?? null;
}

/**
 * Подпись статуса для UI / MCP.
 *
 * @param status - running | stopped | error
 * @param restorePending - true если токен ждёт restore
 * @returns Человекочитаемая подпись
 */
export function formatBotStatusLabel(
  status: string,
  restorePending = false,
): string {
  if (restorePending) {
    return '🟡 Восстанавливается';
  }
  if (status === 'running') {
    return '🟢 Работает';
  }
  if (status === 'stopped') {
    return '🔴 Остановлен';
  }
  return '⚪ Неизвестно';
}
