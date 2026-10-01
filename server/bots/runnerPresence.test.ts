/**
 * @fileoverview Тесты ожидания удалённого исполнителя (ping → pong/hello)
 * @module server/bots/runnerPresence.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { RunnerPresence } from "./runnerPresence";

describe("RunnerPresence", () => {
  it("повторяет ping, пока исполнитель не ответит", async () => {
    const presence = new RunnerPresence();
    let pings = 0;
    const waiting = presence.wait(() => {
      pings += 1;
      if (pings === 3) presence.notify();
    }, 1_000, 10);
    await waiting;
    assert.strictEqual(pings, 3);
  });

  it("без ответа — ошибка по таймауту, ping больше не шлётся", async () => {
    const presence = new RunnerPresence();
    let pings = 0;
    await assert.rejects(presence.wait(() => (pings += 1), 50, 10), /не ответил/);
    const after = pings;
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.strictEqual(pings, after);
  });
});
