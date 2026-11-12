/** @fileoverview Изолированный HTTP-двойник Telegram и ограниченные ожидания интеграционного теста. */
import { createServer } from "node:http";
import type { PollingUpdate } from "./queue";

/** Поднимает только локальный HTTP-сервер с повторной доставкой тестового пакета. */
export async function fakeTelegram(batches: Map<string, PollingUpdate[]>) {
  const offsets = new Map<string, number[]>();
  let active = 0, maximum = 0;
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    const token = request.url!.slice(4, -11);
    const payload = JSON.parse(body), offset = payload.offset ?? 0;
    offsets.set(token, [...offsets.get(token) ?? [], offset]);
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 25));
    active--;
    if (response.destroyed) return;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ ok: true, result: (batches.get(token) ?? []).filter(item => item.update_id >= offset) }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  return { base: `http://127.0.0.1:${address.port}`, offsets,
    get maximum() { return maximum; },
    /** Закрывает только сервер, созданный текущим тестом. */
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

/** Ждёт наблюдаемое условие с конечным таймером вместо фиксированной долгой задержки. */
export async function eventually(check: () => Promise<boolean>, timeout = 15_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error("Интеграционное условие не выполнено за отведённое время");
}
