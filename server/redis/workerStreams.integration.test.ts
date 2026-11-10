/**
 * @fileoverview Проверка подтверждения и повтора команд исполнителя на настоящем Redis Streams.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  appendToStream, connectStreamRedis, followCommandStream, runnerCommandStream,
} from "./workerStreams";

/**
 * Ожидает событие с ограничением времени.
 * @param signal - Ожидаемое событие
 * @returns Завершение события
 */
async function waitFor(signal: Promise<void>): Promise<void> {
  await Promise.race([
    signal,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Команда не доставлена")), 8_000)),
  ]);
}

/**
 * Ожидает подтверждения команды в группе Redis.
 * @param redis - Соединение проверки
 * @param stream - Поток команды
 * @returns Завершение подтверждения
 */
async function waitForAck(redis: Awaited<ReturnType<typeof connectStreamRedis>>, stream: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const pending = await redis.xpending(stream, "runner");
    if (Number(pending[0]) === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Команда не подтверждена");
}

test("неподтверждённая команда повторяется после перезапуска исполнителя", async () => {
  const url = process.env.LOCAL_REDIS_TEST_URL;
  if (!url) throw new Error("Задайте LOCAL_REDIS_TEST_URL для интеграционного теста");
  const stream = runnerCommandStream(`integration-${randomUUID()}`);
  const writer = await connectStreamRedis(url);
  const firstReader = await connectStreamRedis(url);
  let secondReader: Awaited<ReturnType<typeof connectStreamRedis>> | undefined;
  let firstFollower: ReturnType<typeof followCommandStream> | undefined;
  let secondFollower: ReturnType<typeof followCommandStream> | undefined;
  try {
    let firstSeen!: () => void;
    const firstDelivery = new Promise<void>((resolve) => { firstSeen = resolve; });
    firstFollower = followCommandStream(firstReader, stream, async (command) => {
      assert.equal(command.k, "ping");
      firstSeen();
      throw new Error("Имитация сбоя до подтверждения");
    });
    await firstFollower.ready;
    await appendToStream(writer, stream, { k: "ping", q: "restart" });
    await waitFor(firstDelivery);
    firstFollower.stop();

    let replayed!: () => void;
    const replay = new Promise<void>((resolve) => { replayed = resolve; });
    secondReader = await connectStreamRedis(url);
    secondFollower = followCommandStream(secondReader, stream, async (command) => {
      assert.equal(command.k, "ping");
      assert.equal(command.q, "restart");
      replayed();
    });
    await secondFollower.ready;
    await waitFor(replay);
    await waitForAck(writer, stream);
  } finally {
    firstFollower?.stop();
    secondFollower?.stop();
    firstReader.disconnect();
    secondReader?.disconnect();
    await writer.del(stream);
    writer.disconnect();
  }
});
