/**
 * @fileoverview Роут приёма webhook-апдейтов от Telegram и проксирования в Python-процесс бота
 * @module server/routes/setupWebhookRoutes
 */

import type { Express } from 'express';

/** Базовый порт для aiohttp серверов ботов */
const BASE_WEBHOOK_PORT = 9000;

/**
 * Вычисляет порт aiohttp сервера бота по tokenId.
 * Формула: BASE_WEBHOOK_PORT + tokenId
 * @param tokenId - Идентификатор токена бота
 * @returns Порт на котором слушает Python aiohttp сервер
 */
export function getBotWebhookPort(tokenId: number): number {
  return BASE_WEBHOOK_PORT + tokenId;
}

/**
 * Регистрирует роут приёма webhook-апдейтов от Telegram.
 *
 * Telegram шлёт POST на /api/webhook/:projectId/:tokenId,
 * Node.js проксирует тело запроса в Python aiohttp сервер бота
 * на localhost:{BASE_WEBHOOK_PORT + tokenId}/webhook.
 *
 * Роут активен только если задан WEBHOOK_URL в окружении.
 * В polling-режиме (без WEBHOOK_URL) роут возвращает 404.
 *
 * @param app - Экземпляр Express приложения
 */
export function setupWebhookRoutes(app: Express): void {
  /**
   * POST /api/webhook/:projectId/:tokenId
   * Принимает апдейт от Telegram и пересылает в Python-процесс бота
   */
  app.post('/api/webhook/:projectId/:tokenId', async (req, res) => {
    // Webhook режим активен только при наличии WEBHOOK_URL
    if (!process.env.WEBHOOK_URL) {
      res.status(404).json({ message: 'Webhook режим не активен' });
      return;
    }

    const projectId = parseInt(req.params.projectId, 10);
    const tokenId = parseInt(req.params.tokenId, 10);

    if (isNaN(projectId) || isNaN(tokenId)) {
      res.status(400).json({ message: 'Некорректные projectId или tokenId' });
      return;
    }

    const botPort = getBotWebhookPort(tokenId);
    const targetUrl = `http://localhost:${botPort}/webhook`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(55_000), // Telegram ждёт ответ максимум 60 сек
      });

      res.status(response.status).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(
        `[Webhook] Ошибка проксирования апдейта → проект ${projectId}, токен ${tokenId}, порт ${botPort}: ${message}`
      );
      // Возвращаем 200 чтобы Telegram не повторял апдейт при недоступном боте
      res.status(200).end();
    }
  });
}
