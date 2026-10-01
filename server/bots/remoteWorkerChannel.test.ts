/**
 * @fileoverview Тесты удалённого канала до воркера и кодирования полей Redis Streams
 * @module server/bots/remoteWorkerChannel.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { decodeFields, encodeFields, type RunnerCommand } from "../redis/workerStreams";
import type { RemoteRunnerHub, RunnerEventSink } from "./remoteRunnerHub";
import { RemoteWorkerChannel } from "./remoteWorkerChannel";

/** Поддельный узел: запоминает команды и подписки */
class FakeHub {
  /** Отправленные команды */
  sent: RunnerCommand[] = [];
  /** Подписки по ID экземпляра */
  sinks = new Map<string, RunnerEventSink>();
  /** @param command - Команда */
  send(command: RunnerCommand): void {
    this.sent.push(command);
  }
  /** @param instance - ID экземпляра @param sink - Получатель */
  register(instance: string, sink: RunnerEventSink): void {
    this.sinks.set(instance, sink);
  }
  /** @param instance - ID экземпляра */
  unregister(instance: string): void {
    this.sinks.delete(instance);
  }
}

/**
 * Создаёт канал на поддельном узле
 * @returns узел и канал
 */
function makeChannel(): { hub: FakeHub; channel: RemoteWorkerChannel } {
  const hub = new FakeHub();
  return { hub, channel: new RemoteWorkerChannel(hub as unknown as RemoteRunnerHub, 7) };
}

describe("encodeFields / decodeFields", () => {
  it("пропускают пустые поля и восстанавливают объект", () => {
    const flat = encodeFields({ k: "exit", w: "7", c: undefined, s: "SIGKILL" });
    assert.deepStrictEqual(flat, ["k", "exit", "w", "7", "s", "SIGKILL"]);
    assert.deepStrictEqual(decodeFields(flat), { k: "exit", w: "7", s: "SIGKILL" });
  });
});

describe("RemoteWorkerChannel", () => {
  it("при создании просит исполнителя поднять воркер, строки уходят с ID экземпляра", () => {
    const { hub, channel } = makeChannel();
    assert.strictEqual(channel.pid, undefined);
    assert.ok(channel.send('{"cmd":"status"}'));
    assert.deepStrictEqual(hub.sent, [
      { k: "spawn", w: "7", i: channel.instance },
      { k: "line", w: "7", i: channel.instance, l: '{"cmd":"status"}' },
    ]);
  });

  it("пересылает строки и завершается по exit один раз", () => {
    const { hub, channel } = makeChannel();
    const got: unknown[] = [];
    channel.on("line", (l) => got.push(["line", l]));
    channel.on("exit", (c, s) => got.push(["exit", c, s]));
    const sink = hub.sinks.get(channel.instance)!;
    sink.handle({ k: "line", w: "7", i: channel.instance, l: "{}" });
    sink.handle({ k: "exit", w: "7", i: channel.instance, c: "0" });
    sink.handle({ k: "exit", w: "7", i: channel.instance, c: "1" });
    assert.deepStrictEqual(got, [["line", "{}"], ["exit", 0, null]]);
    assert.strictEqual(hub.sinks.size, 0);
    assert.strictEqual(channel.send("{}"), false);
  });

  it("kill без ответа исполнителя всё равно завершает канал", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const { hub, channel } = makeChannel();
    let signal: string | null = null;
    channel.on("exit", (_c, s) => (signal = s));
    channel.kill();
    assert.strictEqual(hub.sent.at(-1)?.k, "kill");
    t.mock.timers.tick(5_000);
    assert.strictEqual(signal, "SIGKILL");
  });
});
