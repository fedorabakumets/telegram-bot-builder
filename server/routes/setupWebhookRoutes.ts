/** @fileoverview Приём Telegram webhook с доставкой в локальный либо удалённый исполнитель. */
import type { Express } from 'express';
import { storage } from '../storages/storage';
import { getProjectPlacement } from '../bots/botPlacement';
import { createTelegramWebhookHandler } from './telegramWebhookHandler';
import { deliverTelegramWebhook } from './telegramWebhookDelivery';

/** Возвращает порт локального aiohttp обработчика по идентификатору токена. */
export function getBotWebhookPort(tokenId: number): number {
  return 9000 + tokenId;
}

/** Регистрирует публичный маршрут Telegram с проверкой принадлежности бота проекту. */
export function setupWebhookRoutes(app: Express): void {
  app.post('/api/webhook/:projectId/:tokenId', createTelegramWebhookHandler({
    getRecipient: (tokenId) => storage.getBotToken(tokenId),
    deliver: (projectId, tokenId, body, secret) => deliverTelegramWebhook({
      projectId, tokenId, body, secret, remote: getProjectPlacement(projectId).runnerId !== null,
    }),
  }));
}
