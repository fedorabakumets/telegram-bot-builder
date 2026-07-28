/**
 * @fileoverview Redis fan-out подписчик событий проекта между репликами Node
 * @description Канал platform:project_event:{projectId}. Anti-loop через originInstanceId.
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
 * Обрабатывает сообщение из Redis: чужие инстансы → local WS fan-out
 * @param channel - Имя канала
 * @param message - JSON события
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
 * Инициализирует подписку на platform:project_event:*
 */
export function initRedisProjectEventBridge(): void {
  waitForRedis('[RedisProjectEvent]', () => {
    const sub = getRedisSubscriber();
    if (!sub) return;

    sub.psubscribe(SUBSCRIBE_PATTERN).catch((err) =>
      console.error('[RedisProjectEvent] Ошибка psubscribe:', err),
    );

    sub.on('pmessage', (...args: unknown[]) => {
      const [, channel, message] = args as [string, string, string];
      if (typeof channel === 'string' && typeof message === 'string') {
        handleBridgeMessage(channel, message);
      }
    });

    console.log(`[RedisProjectEvent] Подписка на "${SUBSCRIBE_PATTERN}" активна`);
  }, () => {
    console.log('[RedisProjectEvent] Redis недоступен — fan-out только local WS');
  });
}
