/** @fileoverview Проверки подтверждения пакетов, повторов и конфликтов без сети Telegram. */
import { describe, expect, it, vi } from "vitest";
import { runPollingReceiver, PollingRejected } from "./receiver";
import { withPollingLease } from "./lease";
import { requestUpdates } from "./transport";
import { createServer } from "node:http";
import type Redis from "ioredis";

/** Подменяет ожидание продления управляемыми таймерами, сохраняя отмену. */
vi.mock("node:timers/promises", () => ({ setTimeout: (milliseconds: number, value: unknown,
  options: { signal?: AbortSignal } = {}) => new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new Error("Ожидание отменено")); };
    const timer = setTimeout(() => { options.signal?.removeEventListener("abort", abort); resolve(value); }, milliseconds);
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener("abort", abort, { once: true });
  }) }));

describe("лёгкий приёмник", () => {
  it("не получает следующий пакет до успешной записи текущего", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    let attempts = 0, requests = 0, offset: number | null = null;
    await runPollingReceiver({ token: "secret", signal: controller.signal,
      queue: { offset: async () => offset, enqueue: async () => {
        calls.push("persist"); if (++attempts === 1) throw new Error("Redis недоступен"); offset = 8;
      } }, onUpdates: async () => { calls.push("wake"); }, wait: async () => {},
      request: async (_token, payload) => {
        calls.push("request");
        if (++requests === 2) { expect(payload).toMatchObject({ offset: 8 }); controller.abort(); }
        return { status: 200, body: { ok: true, result: requests === 1 ? [{ update_id: 7 }] : [] } };
      } });
    expect(calls).toEqual(["request", "persist", "persist", "wake", "request"]);
  });
  it("останавливается при конфликте токена и не раскрывает описание Telegram", async () => {
    await expect(runPollingReceiver({ token: "secret", signal: new AbortController().signal,
      queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
      request: async () => ({ status: 409, body: { ok: false, description: "secret", error_code: 409 } }),
    })).rejects.toThrow(new PollingRejected("Telegram отклонил polling: код 409"));
  });
  it("отменяет HTTP до освобождения общей блокировки", async () => {
    const controller = new AbortController(), calls: string[] = [];
    const redis = { set: async () => "OK", eval: async () => { calls.push("release"); return 1; } };
    await withPollingLease(redis as unknown as Redis, "token-suffix", controller.signal, async (signal) => {
      controller.abort(); expect(signal.aborted).toBe(true); calls.push("http-stopped");
    }, async () => { calls.push("children-stopped"); });
    expect(calls).toEqual(["http-stopped", "children-stopped", "release"]);
  });
  it("не запускает запрос при занятой блокировке", async () => {
    await expect(withPollingLease({ set: async () => null } as unknown as Redis, "secret",
      new AbortController().signal, async () => { throw new Error("HTTP не должен запускаться"); }))
      .rejects.toThrow("Polling уже принадлежит другому обработчику");
  });
  it("при потере lease отменяет запрос и ожидает его до освобождения", async () => {
    vi.useFakeTimers();
    try {
      const calls: string[] = [];
      const redis = { set: async () => "OK", eval: async (script: string) => {
        calls.push(script.includes("EXPIRE") ? "renew" : "release"); return 0;
      } };
      const running = withPollingLease(redis as unknown as Redis, "secret", new AbortController().signal,
        async (signal) => new Promise<void>((resolve) => {
          signal.addEventListener("abort", () => { calls.push("cancel"); resolve(); }, { once: true });
        }));
      const failure = expect(running).rejects.toThrow("Потеряна блокировка polling");
      await vi.advanceTimersByTimeAsync(15_000);
      await failure;
      expect(calls).toEqual(["renew", "cancel", "release"]);
    } finally { vi.useRealTimers(); }
  });
  it("не начинает HTTP после отмены во время захвата lease", async () => {
    const controller = new AbortController();
    const redis = { set: async () => { controller.abort(); return "OK"; }, eval: async () => 1 };
    const receive = vi.fn();
    await withPollingLease(redis as unknown as Redis, "secret", controller.signal, receive);
    expect(receive).not.toHaveBeenCalled();
  });
  it("разбирает ответ локального HTTP и отправляет разрешённые поля", async () => {
    let received = "";
    const server = createServer(async (request, response) => {
      for await (const chunk of request) received += chunk;
      response.end(JSON.stringify({ ok: true, result: [{ update_id: 42 }] }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address() as { port: number };
      const result = await requestUpdates("test-token", { timeout: 25 }, new AbortController().signal,
        `http://127.0.0.1:${address.port}`);
      expect(JSON.parse(received)).toEqual({ timeout: 25 });
      expect(result.body.result).toEqual([{ update_id: 42 }]);
    } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
  it("ограничивает тело fake HTTP и скрывает адрес с токеном", async () => {
    const server = createServer((_req, response) => response.end("x".repeat(100)));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address() as { port: number };
      await expect(requestUpdates("secret-token", {}, new AbortController().signal,
        `http://127.0.0.1:${address.port}`, 10)).rejects.toThrow("Не удалось получить обновления Telegram");
    } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
});
