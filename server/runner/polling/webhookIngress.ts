/** @fileoverview Лёгкий webhook-приёмник: регистрация Telegram, надёжная очередь и пробуждение без Python. */
import { timingSafeEqual } from "node:crypto";
import type Redis from "ioredis";
import type { PollingBot } from "./dispatcherTypes";
import { DemandQueue, type PollingUpdate } from "./queue";
import { withPollingLease } from "./lease";
import { telegramPollingId } from "./runtimeSettings";
import { requestUpdates } from "./transport";
import { ALLOWED_UPDATES } from "./receiver";

/** Хранит только лёгкие регистрации; код бота загружается диспетчером по сохранённому событию. */
export class WebhookIngress {
  /** Регистрации доступны только владельцу lease. */
  private readonly bots = new Map<number, PollingBot>();
  /** @param client - Подключение хранилища бота. @param wake - Пробуждение после сохранения. */
  constructor(private readonly client: (bot: PollingBot) => Promise<Redis>, private readonly wake: (tokenId: number) => void) {}

  /** Поддерживает регистрацию, не вызывает getUpdates и снимает её только при явной остановке. */
  async receive(bot: PollingBot, signal: AbortSignal, ready: () => void, quiesce: () => Promise<void>): Promise<void> {
    if (!bot.webhook) throw new Error("Не настроен webhook-приёмник");
    const redis = await this.client(bot);
    await withPollingLease(redis, bot.token, signal, async owned => {
      const response = await requestUpdates(bot.token, { url: bot.webhook!.url,
        secret_token: bot.webhook!.secret, allowed_updates: ALLOWED_UPDATES, drop_pending_updates: false },
      owned, bot.env.TELEGRAM_BOT_API_URL, 1024 * 1024, "setWebhook");
      if (response.body.ok !== true) throw new Error("Telegram отклонил регистрацию webhook");
      if (owned.aborted || signal.aborted) return;
      this.bots.set(bot.tokenId, bot);
      ready();
      try {
        await new Promise<void>(resolve => {
          if (owned.aborted) resolve();
          else owned.addEventListener("abort", () => resolve(), { once: true });
        });
      } finally {
        if (this.bots.get(bot.tokenId) === bot) this.bots.delete(bot.tokenId);
        if (signal.aborted) {
          const deleted = await requestUpdates(bot.token, { drop_pending_updates: false }, AbortSignal.timeout(10_000),
            bot.env.TELEGRAM_BOT_API_URL, 1024 * 1024, "deleteWebhook");
          if (deleted.body.ok !== true) throw new Error("Telegram отклонил остановку webhook");
        }
      }
    }, quiesce);
  }

  /** Возвращает false для постоянного Python; true означает, что обновление уже сохранено в Redis. */
  async enqueue(projectId: number, tokenId: number, update: unknown, secret: string): Promise<boolean> {
    const bot = this.bots.get(tokenId);
    if (!bot || !bot.webhook) return false;
    if (bot.projectId !== projectId) throw new Error("Webhook принадлежит другому проекту");
    const expected = Buffer.from(bot.webhook.secret), actual = Buffer.from(secret);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("Неверный секрет webhook");
    if (!update || typeof update !== "object" || Array.isArray(update)
      || !Number.isSafeInteger((update as PollingUpdate).update_id) || (update as PollingUpdate).update_id < 0)
      throw new Error("Некорректное обновление webhook");
    const redis = await this.client(bot);
    if (this.bots.get(tokenId) !== bot) throw new Error("Регистрация webhook остановлена");
    await new DemandQueue(redis, telegramPollingId(bot.token)).enqueueWebhook(update as PollingUpdate);
    if (this.bots.get(tokenId) === bot) this.wake(tokenId);
    return true;
  }
}
