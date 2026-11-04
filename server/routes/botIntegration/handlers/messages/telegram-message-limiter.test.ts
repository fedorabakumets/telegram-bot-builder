/**
 * @fileoverview Проверка общего ограничения скорости отправки Telegram.
 */
import { describe, expect, it, vi } from "vitest";
vi.mock("../../../../redis/redisClient", () => ({ getRedisPublisher: () => null }));
import { pauseTelegramMessages, waitForTelegramMessages } from "./telegram-message-limiter";

describe("Ограничение отправок Telegram", () => {
  it("учитывает параллельные отправки и размер альбома отдельно для каждого бота", async () => {
    vi.useFakeTimers();
    try {
      const completed: string[] = [];
      const first = waitForTelegramMessages("album-bot", 3).then(() => completed.push("album"));
      const second = waitForTelegramMessages("album-bot").then(() => completed.push("next"));
      const other = waitForTelegramMessages("other-bot").then(() => completed.push("other"));
      await vi.advanceTimersByTimeAsync(0);
      expect(completed).toEqual(["album", "other"]);
      await vi.advanceTimersByTimeAsync(149);
      expect(completed).toEqual(["album", "other"]);
      await vi.advanceTimersByTimeAsync(1);
      await Promise.all([first, second, other]);
      expect(completed).toEqual(["album", "other", "next"]);
    } finally { vi.useRealTimers(); }
  });

  it("продлевает ожидание всех следующих отправок при ответе 429", async () => {
    vi.useFakeTimers();
    try {
      await waitForTelegramMessages("paused-bot");
      const pending = waitForTelegramMessages("paused-bot");
      let completed = false;
      void pending.then(() => { completed = true; });
      await pauseTelegramMessages("paused-bot", 2);
      await vi.advanceTimersByTimeAsync(2249);
      expect(completed).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(completed).toBe(true);
    } finally { vi.useRealTimers(); }
  });
});
