/** @fileoverview Формирует несекретный снимок зарегистрированных сценариев диспетчера. */
import type { DispatchEntry, DispatcherCapacity } from "./dispatcherTypes";

/** Возвращает агрегаты и подтверждённые локальные состояния без токенов и сообщений. */
export function dispatcherCounters(entries: Map<number, DispatchEntry>, active: number, capacity: DispatcherCapacity) {
  return { registeredBots: entries.size, activeChildren: active,
    maximum: typeof capacity === "number" && capacity > 0 ? capacity : null,
    bots: [...entries.values()].map((entry) => ({ tokenId: entry.bot.tokenId,
      activity: (!entry.ready || (entry.task && !entry.child) ? "starting" : entry.child ? "active"
        : entry.pending && !entry.task && !entry.retry && typeof capacity === "number" && capacity > 0 && active >= capacity
          ? "waiting" : "sleeping") as "starting" | "active" | "sleeping" | "waiting" })),
    waitingBots: [...entries.values()].filter((entry) => entry.pending && !entry.task).length };
}
