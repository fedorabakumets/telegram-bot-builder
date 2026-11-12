/** @fileoverview Сквозная проверка Node HTTP → Redis → настоящий Python с выходом по простою. */
import { testPython } from "./testPython";
import { randomInt } from "node:crypto";
import { resolve } from "node:path";
import Redis from "ioredis";
import { expect, it } from "vitest";
import { DemandQueue } from "./queue";
import { withPollingLease } from "./lease";
import { runPollingReceiver } from "./receiver";
import { requestUpdates } from "./transport";
import { startPythonPollingChild, type PythonPollingChild } from "./pythonChild";
import { NodePollingDispatcher } from "./dispatcher";
import { eventually, fakeTelegram } from "./integrationHelpers";

it("сохраняет два потока, устраняет повторы, восстанавливает состояние и не держит Python в простое", async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379";
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const ids = [randomInt(800_000_000_000, 900_000_000_000), randomInt(900_000_000_000, 999_000_000_000)];
  const tokens = ids.map(id => `${id}:fixture_secret_never_real_${id}`);
  const queues = ids.map(id => new DemandQueue(redis, id));
  const stateKeys = ids.map(id => `tbb:demand:{${id}}:state:99001:${id}`);
  const batches = new Map(tokens.map(token => [token, [{ update_id: 1 }, { update_id: 1 }]]));
  const telegram = await fakeTelegram(batches);
  const aborts: AbortController[] = [], receivers: Promise<void>[] = [];
  const children = new Set<PythonPollingChild>();
  const active = new Map<number, PythonPollingChild>();
  const logs: string[][] = [[], []];
  /** Запускает только реальный изолированный process_child, не общий Python worker. */
  async function launch(index: number, signal: AbortSignal): Promise<PythonPollingChild> {
    const child = await startPythonPollingChild({
      command: testPython(),
      args: ["-u", resolve(`server/python/${process.platform === "win32" ? "process_child_windows.py" : "process_child.py"}`)], signal,
      env: process.env, init: { token_id: ids[index], token: tokens[index], project_id: 99001,
        bot_file: resolve("server/runner/polling/fixtures/state_bot.py"), idle: 0.25,
        env: { REDIS_URL: redisUrl } },
      onEvent: event => { if (typeof event.content === "string") logs[index].push(event.content); },
    });
    active.set(index, child); children.add(child);
    void child.done.then(() => { active.delete(index); });
    return child;
  }
  const dispatcher = new NodePollingDispatcher({
    hasPending: bot => queues[ids.indexOf(bot.tokenId)].peek().then(value => value !== null),
    startChild: (bot, signal) => launch(ids.indexOf(bot.tokenId), signal),
    receive: (bot, signal, wake, ready) => withPollingLease(redis, bot.token, signal, leaseSignal => {
      ready();
      return runPollingReceiver({ token: bot.token, signal: leaseSignal, queue: queues[ids.indexOf(bot.tokenId)],
        onUpdates: async () => wake(), request: (token, payload, abort) => requestUpdates(token, payload, abort, telegram.base) });
    }),
    lifecycle: () => {},
  }, 2);
  /** Получатель проходит настоящий HTTP и общий lease; тестовые токены исключают пересечение с ботами. */
  function receive(index: number): Promise<void> {
    const controller = new AbortController(); aborts.push(controller);
    const running = withPollingLease(redis, tokens[index], controller.signal, signal => runPollingReceiver({
      token: tokens[index], signal, queue: queues[index], onUpdates: () => Promise.resolve(),
      request: (token, payload, abort) => requestUpdates(token, payload, abort, telegram.base),
    }));
    void running.catch(() => {});
    receivers.push(running); return running;
  }
  try {
    await redis.ping();
    receive(0); receive(1);
    await eventually(async () => (await Promise.all(queues.map(queue => queue.offset()))).every(offset => offset === 2));
    await expect(withPollingLease(redis, tokens[0], new AbortController().signal,
      async () => { throw new Error("Второй владелец не должен запускаться"); })).rejects.toThrow("Polling уже принадлежит");
    // Останавливаем до обработки: сохранённый пакет обязан пережить смену получателя.
    aborts.forEach(controller => controller.abort()); await Promise.all(receivers);
    expect(await redis.zcard(queues[0].keys[0])).toBe(1);
    await Promise.all(ids.map((id, index) => dispatcher.start({ tokenId: id, token: tokens[index],
      botFile: resolve("server/runner/polling/fixtures/state_bot.py"), projectId: 99001, env: { REDIS_URL: redisUrl },
      idleTimeout: 0.25, workerKey: "integration", instance: "fixture" })));
    await eventually(async () => active.size === 2);
    await eventually(async () => active.size === 0 && (await Promise.all(queues.map(queue => queue.peek()))).every(value => value === null));
    expect(logs[0].filter(line => line.includes("HANDLED=1"))).toHaveLength(1);
    expect(logs[1].filter(line => line.includes("HANDLED=1"))).toHaveLength(1);
    expect(telegram.maximum).toBeGreaterThanOrEqual(2);
    for (const token of tokens) batches.set(token, [{ update_id: 2 }]);
    await eventually(async () => logs.every(lines => lines.some(line => line.includes("HANDLED=2"))));
    await eventually(async () => active.size === 0);
    expect(children.size).toBe(4);
    for (const child of children) {
      expect((await child.done).code).toBe(0);
      expect(() => process.kill(child.actualPid!, 0)).toThrow();
    }
    expect(await queues[0].offset()).toBe(3);
    expect(telegram.offsets.get(tokens[0])).toContain(2);
    expect(await redis.get(stateKeys[0])).toContain("count");
  } finally {
    await dispatcher.shutdown();
    aborts.forEach(controller => controller.abort());
    await Promise.allSettled(receivers);
    await Promise.allSettled([...children].map(child => child.stop()));
    await redis.del(...queues.flatMap(queue => queue.keys), ...stateKeys);
    redis.disconnect(); await telegram.close();
  }
});
