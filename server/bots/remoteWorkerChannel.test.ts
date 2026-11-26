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
  /** Проверяет сигнал без кода, старый null и повреждённое поле исполнителя. */
  it("сохраняет SIGKILL и неизвестный код без NaN", () => {
    for (const code of [undefined, "null", "NaN", "bad", ""]) {
      const { hub, channel } = makeChannel();
      const exits: unknown[] = [];
      channel.on("exit", (c, s) => exits.push([c, s]));
      hub.sinks.get(channel.instance)!.handle({ k: "exit", w: "7", i: channel.instance, c: code, s: "SIGKILL" });
      assert.deepStrictEqual(exits, [[null, "SIGKILL"]]);
    }
  });

  it("подключается к существующему воркеру без повторного spawn", () => {
    const hub = new FakeHub();
    const channel = RemoteWorkerChannel.attach(hub as unknown as RemoteRunnerHub, 7, "existing");
    const got: string[] = [];
    channel.on("line", (line) => got.push(line));
    hub.sinks.get("existing")?.handle({ k: "line", w: "7", i: "existing", l: "ready" });
    assert.deepStrictEqual(got, ["ready"]);
    assert.deepStrictEqual(hub.sent, []);
  });

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
    assert.strictEqual(hub.sent[hub.sent.length - 1]?.k, "kill");
    t.mock.timers.tick(5_000);
    assert.strictEqual(signal, "SIGKILL");
  });

  /** Проверяет ответ владельца того же экземпляра на конкретный запрос переноса. */
  it("подтверждает остановку только ответом с идентификатором запроса", async () => {
    const { hub, channel } = makeChannel();
    const confirmation = channel.confirmCutoverExit(1_000);
    const command = hub.sent[hub.sent.length - 1];
    assert.equal(command?.k, "retire");
    assert.equal(command.w, "7");
    assert.equal(command.i, channel.instance);
    assert.ok(command.q);
    const sink = hub.sinks.get(channel.instance);
    assert.ok(sink);
    sink.handle({ k: "retired", w: "7", i: channel.instance, q: command.q, confirmed: "1" });
    assert.equal(await confirmation, true);
  });

  /** Запоздалое подтверждение другой операции не разрешает общий запуск. */
  it("игнорирует неподходящий запрос, ключ воркера и экземпляр", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const { hub, channel } = makeChannel();
    const confirmation = channel.confirmCutoverExit(50);
    const query = hub.sent[hub.sent.length - 1]?.q;
    const sink = hub.sinks.get(channel.instance);
    assert.ok(query && sink);
    sink.handle({ k: "retired", w: "7", i: channel.instance, q: "предыдущий-запрос", confirmed: "1" });
    sink.handle({ k: "retired", w: "8", i: channel.instance, q: query, confirmed: "1" });
    sink.handle({ k: "retired", w: "7", i: "другой-экземпляр", q: query, confirmed: "1" });
    t.mock.timers.tick(50);
    assert.equal(await confirmation, false);
  });

  /** Отказ показывает, что удалённый процесс остался под прежним управлением. */
  it("возвращает отказ владельца и оставляет канал доступным", async () => {
    const { hub, channel } = makeChannel();
    const confirmation = channel.confirmCutoverExit(1_000);
    const query = hub.sent[hub.sent.length - 1]?.q;
    const sink = hub.sinks.get(channel.instance);
    assert.ok(query && sink);
    sink.handle({ k: "retired", w: "7", i: channel.instance, q: query, confirmed: "0" });
    assert.equal(await confirmation, false);
    assert.equal(channel.send('{"cmd":"status"}'), true);
  });

  /** Защищает перенос после таймаута kill и обычного завершения канала. */
  it("не принимает обычный exit или таймаут kill за подтверждение переноса", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const first = makeChannel();
    const firstConfirmation = first.channel.confirmCutoverExit(6_000);
    first.hub.sinks.get(first.channel.instance)?.handle({ k: "exit", w: "7", i: first.channel.instance, c: "0" });

    const second = makeChannel();
    const secondConfirmation = second.channel.confirmCutoverExit(6_000);
    second.channel.kill();
    t.mock.timers.tick(6_000);

    assert.equal(await firstConfirmation, false);
    assert.equal(await secondConfirmation, false);
  });
});
