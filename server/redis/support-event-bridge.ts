/**
 * @fileoverview Подписка Redis на события чата поддержки между репликами
 * @module server/redis/support-event-bridge
 */

import type { SupportWsEvent } from "@shared/support/support-ws.types";
import { broadcastSupportEventLocal, SUPPORT_EVENT_CHANNEL } from "../support/broadcast-support-event";
import { getInstanceId } from "./instanceId";
import { getRedisSubscriber } from "./redisClient";
import { waitForRedis } from "./waitForRedis";

/** Паттерн psubscribe: канал один, но общий subscriber шлёт pmessage */
const SUBSCRIBE_PATTERN = SUPPORT_EVENT_CHANNEL;

/**
 * Пропускает событие, которое опубликовала эта же реплика
 * @param event - Событие из Redis
 * @returns true, если fan-out не нужен
 */
function isOwnInstance(event: SupportWsEvent): boolean {
  return Boolean(event.originInstanceId && event.originInstanceId === getInstanceId());
}

/**
 * Разбирает сообщение Redis и рассылает его локальным сокетам
 * @param message - JSON события
 */
function handleSupportBridgeMessage(message: string): void {
  try {
    const event = JSON.parse(message) as SupportWsEvent;
    if (!event || typeof event.type !== "string" || typeof event.userId !== "number") return;
    if (isOwnInstance(event)) return;
    broadcastSupportEventLocal(event);
  } catch (err) {
    console.error("[support-ws] Ошибка разбора события Redis:", err);
  }
}

/**
 * Подписывается на platform:support_event. Без Redis остаётся локальная рассылка.
 */
export function initSupportEventBridge(): void {
  waitForRedis("[support-ws]", () => {
    const subscriber = getRedisSubscriber();
    if (!subscriber) return;

    subscriber.psubscribe(SUBSCRIBE_PATTERN).catch((err) =>
      console.error("[support-ws] Ошибка psubscribe:", err),
    );

    subscriber.on("pmessage", (...args: unknown[]) => {
      const [pattern, , message] = args as [string, string, string];
      if (pattern !== SUBSCRIBE_PATTERN || typeof message !== "string") return;
      handleSupportBridgeMessage(message);
    });

    console.log(`[support-ws] Подписка на "${SUBSCRIBE_PATTERN}" активна`);
  }, () => {
    console.log("[support-ws] Redis недоступен — события только на этой реплике");
  });
}
