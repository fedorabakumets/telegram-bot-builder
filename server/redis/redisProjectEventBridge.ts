/**
 * @fileoverview Redis fan-out подписчик событий проекта между репликами Node.
 * Канал `platform:project_event:{projectId}`. Anti-loop через originInstanceId.
 * Общий ioredis subscriber шлёт все pmessage всем listeners — обрабатываем
 * только свой паттерн (как redisLogsSubscriber).
 * @module server/redis/redisProjectEventBridge
 */

import { getRedisSubscriber } from './redisClient';
import { waitForRedis } from './waitForRedis';
import { getInstanceId } from './instanceId';
import type { ProjectEvent } from '../terminal/ProjectEvent';
import { shouldSkipBridgedProjectEvent } from '../../shared/project-sync/project-event';
import { broadcastProjectEventLocal } from '../terminal/broadcastProjectEvent';

/** Паттерн подписки на project events между репликами */
const SUBSCRIBE_PATTERN = 'platform:project_event:*';

export { shouldSkipBridgedProjectEvent };

/**
 * Обрабатывает сообщение из Redis: чужие инстансы → local WS fan-out.
 * @param channel - Имя канала
 * @param message - JSON события ProjectEvent
 * @returns void
 */
function handleBridgeMessage(channel: string, message: string): void {
  try {
    const event = JSON.parse(message) as ProjectEvent;
    if (!event || typeof event.projectId !== 'number' || typeof event.type !== 'string') {
      return;
    }
    if (shouldSkipBridgedProjectEvent(event, getInstanceId())) {
      return;
    }
    void broadcastProjectEventLocal(event.projectId, event);
  } catch (err) {
    console.error(`[RedisProjectEvent] Ошибка разбора ${channel}:`, err);
  }
}

/**
 * Инициализирует подписку на platform:project_event:*.
 * @returns void
 */
export function initRedisProjectEventBridge(): void {
  waitForRedis('[RedisProjectEvent]', () => {
    const sub = getRedisSubscriber();
    if (!sub) return;

    sub.psubscribe(SUBSCRIBE_PATTERN).catch((err) =>
      console.error('[RedisProjectEvent] Ошибка psubscribe:', err),
    );

    sub.on('pmessage', (...args: unknown[]) => {
      const [pattern, channel, message] = args as [string, string, string];
      // Общий subscriber: игнор чужих паттернов (bot:*, bot:logs:*, …)
      if (pattern !== SUBSCRIBE_PATTERN) return;
      if (typeof channel !== 'string' || typeof message !== 'string') return;
      handleBridgeMessage(channel, message);
    });

    console.log(`[RedisProjectEvent] Подписка на "${SUBSCRIBE_PATTERN}" активна`);
  }, () => {
    console.log('[RedisProjectEvent] Redis недоступен — fan-out только local WS');
  });
}
