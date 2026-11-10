/**
 * @fileoverview Проверки эксклюзивной аренды исполнителя и реакции на её потерю.
 * @module server/bots/runtime-lease.test
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { acquireRuntimeLease, watchRuntimeLease, type LeaseRedis } from "./runtime-lease";

/** Поддельный Redis с проверкой владельца ключа. */
class FakeRedis implements LeaseRedis {
  /** Текущий владелец. */
  owner: string | null = null;

  /** Захватывает свободный ключ. */
  async set(_key: string, value: string, _mode: "PX", _ttl: number, _condition: "NX"): Promise<string | null> {
    if (this.owner !== null) return null;
    this.owner = value;
    return "OK";
  }

  /** Продлевает или освобождает ключ только для владельца. */
  async eval(script: string, _keyCount: number, _key: string, owner: string): Promise<number> {
    if (this.owner !== owner) return 0;
    if (script.includes("PEXPIRE")) return 1;
    this.owner = null;
    return 1;
  }
}

afterEach(() => vi.useRealTimers());

describe("аренда исполнителя", () => {
  it("не допускает второго владельца и не удаляет чужую аренду", async () => {
    const redis = new FakeRedis();
    const first = await acquireRuntimeLease(redis, "runner-1", 15_000);
    expect(first).not.toBeNull();
    expect(await acquireRuntimeLease(redis, "runner-1", 15_000)).toBeNull();
    redis.owner = "новый-владелец";
    expect(await first!.renew()).toBe(false);
    await first!.release();
    expect(redis.owner).toBe("новый-владелец");
  });

  it("сообщает о потере аренды после неудачного продления", async () => {
    vi.useFakeTimers();
    const redis = new FakeRedis();
    const lease = (await acquireRuntimeLease(redis, "runner-1", 15_000))!;
    const lost = vi.fn();
    watchRuntimeLease(lease, 1_000, lost, 3_000);
    redis.owner = "новый-владелец";
    await vi.advanceTimersByTimeAsync(1_100);
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it("завершает наблюдение, если Redis не отвечает", async () => {
    vi.useFakeTimers();
    const lost = vi.fn();
    watchRuntimeLease({ owner: "x", renew: () => new Promise(() => {}), release: async () => {} }, 1_000, lost, 3_000);
    await vi.advanceTimersByTimeAsync(3_100);
    expect(lost).toHaveBeenCalledTimes(1);
  });
});
