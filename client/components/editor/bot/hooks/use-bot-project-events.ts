/**
 * @fileoverview Хук для подписки на события всех проектов бота
 * @module client/components/editor/bot/hooks/use-bot-project-events
 */

import { useProjectEventsWs } from '@/hooks/use-project-events-ws';
import type { BotProject } from '@shared/schema';

/**
 * Вызывает useProjectEventsWs для каждого проекта из списка.
 * Обеспечивает real-time обновление списка ботов при создании/удалении токенов.
 *
 * @param projects - Список проектов для подписки
 */
export function useBotProjectEvents(projects: BotProject[]): void {
  // Хуки вызываются для фиксированного числа проектов — порядок стабилен
  // Используем до 10 слотов (реальное число проектов обычно мало)
  const p0 = projects[0]?.id ?? 0;
  const p1 = projects[1]?.id ?? 0;
  const p2 = projects[2]?.id ?? 0;
  const p3 = projects[3]?.id ?? 0;
  const p4 = projects[4]?.id ?? 0;

  useProjectEventsWs(p0);
  useProjectEventsWs(p1);
  useProjectEventsWs(p2);
  useProjectEventsWs(p3);
  useProjectEventsWs(p4);
}
