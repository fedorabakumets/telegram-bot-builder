/**
 * @fileoverview Хук для подписки на события всех проектов бота.
 * Пробрасывает callback onTokenCreated в каждый WebSocket-слот.
 * @module client/components/editor/bot/hooks/use-bot-project-events
 */

import { useProjectEventsWs } from '@/hooks/use-project-events-ws';
import type { BotProject } from '@shared/schema';

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
}

/**
 * Вызывает useProjectEventsWs для каждого проекта из списка.
 * Обеспечивает real-time обновление списка ботов при создании/удалении токенов.
 * При создании токена вызывает onTokenCreated, если передан.
 *
 * @param projects - Список проектов для подписки
 * @param options - Опциональные callback-и для событий
 */
export function useBotProjectEvents(
  projects: BotProject[],
  options?: UseBotProjectEventsOptions,
): void {
  const { onTokenCreated } = options ?? {};

  // Хуки вызываются для фиксированного числа проектов — порядок стабилен
  // Используем до 5 слотов (реальное число проектов обычно мало)
  const p0 = projects[0]?.id ?? 0;
  const p1 = projects[1]?.id ?? 0;
  const p2 = projects[2]?.id ?? 0;
  const p3 = projects[3]?.id ?? 0;
  const p4 = projects[4]?.id ?? 0;

  useProjectEventsWs(p0, { onTokenCreated });
  useProjectEventsWs(p1, { onTokenCreated });
  useProjectEventsWs(p2, { onTokenCreated });
  useProjectEventsWs(p3, { onTokenCreated });
  useProjectEventsWs(p4, { onTokenCreated });
}
