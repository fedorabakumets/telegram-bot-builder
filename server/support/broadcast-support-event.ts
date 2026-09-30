/**
 * @fileoverview Рассылка событий поддержки: локальные сокеты и Redis
 * @module server/support/broadcast-support-event
 */

import type { SupportWsEvent } from "@shared/support/support-ws.types";
import { getInstanceId } from "../redis/instanceId";
import { getRedisPublisher, isRedisAvailable } from "../redis/redisClient";
import { fanOutSupportLocal } from "./support-connections";

/** Канал Redis для событий чата поддержки между репликами */
export const SUPPORT_EVENT_CHANNEL = "platform:support_event";

/**
 * Рассылает событие сокетам этой реплики без публикации в Redis.
 * Вызывается подписчиком чужих реплик.
 * @param event - Событие с originInstanceId
 */
export function broadcastSupportEventLocal(event: SupportWsEvent): void {
  fanOutSupportLocal(event.userId, JSON.stringify(event));
}

/**
 * Рассылает событие локально и публикует его для других реплик.
 * Ошибка Redis не пробрасывается: локальные сокеты уже получили событие.
 * @param event - Событие без originInstanceId
 */
export async function broadcastSupportEvent(
  event: Omit<SupportWsEvent, "originInstanceId">,
): Promise<void> {
  const full = { ...event, originInstanceId: getInstanceId() } as SupportWsEvent;
  broadcastSupportEventLocal(full);

  if (!isRedisAvailable()) return;
  const publisher = getRedisPublisher();
  if (!publisher) return;
  try {
    await publisher.publish(SUPPORT_EVENT_CHANNEL, JSON.stringify(full));
  } catch (err) {
    console.error("[support-ws] Ошибка публикации в Redis:", err);
  }
}
