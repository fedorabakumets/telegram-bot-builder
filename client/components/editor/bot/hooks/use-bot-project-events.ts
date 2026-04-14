/**
 * @fileoverview Хук для подписки на события всех проектов бота через одно WebSocket-соединение.
 * Заменяет прежний подход с 5 фиксированными слотами на единое соединение.
 * @module client/components/editor/bot/hooks/use-bot-project-events
 */

import { useAllProjectsEventsWs } from '@/hooks/use-all-projects-events-ws';

/**
 * Опции хука подписки на события проектов бота
 */
interface UseBotProjectEventsOptions {
  /**
   * Callback, вызываемый при создании нового токена в любом из проектов.
   * @param projectId - ID проекта
   * @param tokenId - ID нового токена
   * @param tokenName - Имя нового токена
   */
  onTokenCreated?: (projectId: number, tokenId: number, tokenName: string) => void;
  /**
   * Callback при запуске бота — для очистки логов на всех вкладках.
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   */
  onBotStarted?: (projectId: number, tokenId: number) => void;
}

/**
 * Подписывается на события всех проектов пользователя через одно WebSocket-соединение.
 */
export function useBotProjectEvents(
  _projects: { id: number }[],
  options?: UseBotProjectEventsOptions,
): void {
  useAllProjectsEventsWs({
    onTokenCreated: options?.onTokenCreated,
    onBotStarted: options?.onBotStarted,
  });
}
