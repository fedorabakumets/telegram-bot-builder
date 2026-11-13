/** @fileoverview Защищённая доставка webhook из API в локальный Python исполнителя. */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";

/** Параметры внутреннего HTTP-сервера без публикации секретов. */
export interface RunnerWebhookOptions {
  /** Общий секрет API и исполнителя. */
  secret: string;
  /** Проверка подтверждённой регистрации бота. */
  isRunning: (projectId: number, tokenId: number) => boolean;
  /** Подмена транспорта только для адресных тестов. */
  deliver?: typeof fetch;
  /** Сохраняет обновление process-бота; false означает прямой Python-обработчик. */
  enqueueWebhook?: (projectId: number, tokenId: number, update: unknown, secret: string) => Promise<boolean>;
}

/** Сравнивает авторизацию без зависимости времени от совпавшего префикса. */
function authorized(value: string | undefined, secret: string): boolean {
  const actual = Buffer.from(value ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Принимает ограниченный JSON и сохраняет секрет Telegram при пересылке в Python. */
export async function handleRunnerWebhook(req: IncomingMessage, res: ServerResponse, options: RunnerWebhookOptions): Promise<void> {
  if (!authorized(req.headers.authorization, options.secret)) { res.writeHead(401).end(); return; }
  const match = /^\/internal\/webhook\/([1-9]\d*)\/([1-9]\d*)$/.exec(req.url ?? "");
  if (req.method !== "POST" || !match) { res.writeHead(404).end(); return; }
  const projectId = Number(match[1]), tokenId = Number(match[2]);
  if (!Number.isSafeInteger(projectId) || !Number.isSafeInteger(tokenId) || tokenId > 56535) {
    res.writeHead(400).end(); return;
  }
  if (!options.isRunning(projectId, tokenId)) { res.writeHead(503).end(); return; }
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const part of req) {
      const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
      size += chunk.length;
      if (size > 1024 * 1024) { res.writeHead(413).end(); return; }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    let update: unknown;
    try { update = JSON.parse(body); } catch { res.writeHead(400).end(); return; }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const telegramSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (typeof telegramSecret === "string") headers["X-Telegram-Bot-Api-Secret-Token"] = telegramSecret;
    if (await options.enqueueWebhook?.(projectId, tokenId, update, typeof telegramSecret === "string" ? telegramSecret : "")) {
      res.writeHead(200).end(); return;
    }
    const response = await (options.deliver ?? fetch)(`http://127.0.0.1:${9000 + tokenId}/webhook`, {
      method: "POST", headers, body, signal: AbortSignal.timeout(50_000), redirect: "error",
    });
    await response.body?.cancel();
    res.writeHead(response.status).end();
  } catch (error) {
    if (!res.headersSent) res.writeHead(error instanceof Error && error.name === "TimeoutError" ? 504 : 503).end();
  }
}

/** Создаёт сервер; отсутствие секрета отключает внутренний порт для прежних установок. */
export async function startRunnerWebhookServer(isRunning: RunnerWebhookOptions["isRunning"], env = process.env,
  enqueueWebhook?: RunnerWebhookOptions["enqueueWebhook"]): Promise<Server | undefined> {
  const secret = env.RUNNER_WEBHOOK_SECRET?.trim();
  if (!secret) return undefined;
  if (secret.length < 32) throw new Error("RUNNER_WEBHOOK_SECRET должен содержать минимум 32 символа");
  const port = Number(env.RUNNER_WEBHOOK_PORT ?? "9080");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Некорректный RUNNER_WEBHOOK_PORT");
  const server = createServer((req, res) => { void handleRunnerWebhook(req, res, { secret, isRunning, enqueueWebhook }); });
  server.requestTimeout = 55_000;
  server.headersTimeout = 10_000;
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(port, "::", resolve); });
  return server;
}
