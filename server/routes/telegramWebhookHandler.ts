/** @fileoverview Проверка адресата Telegram webhook и подтверждение только фактической доставки. */
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

/** Минимальные настройки адресата без раскрытия токена бота. */
export interface WebhookRecipient {
  /** Проект, которому принадлежит бот. */
  projectId: number;
  /** Настроенный способ получения обновлений. */
  launchMode?: string | null;
  /** Секрет, ожидаемый от Telegram. */
  webhookSecretToken?: string | null;
}

/** Зависимости проверки и доставки обновления. */
export interface WebhookDependencies {
  /** Загружает настройки только указанного токена. */
  getRecipient: (tokenId: number) => Promise<WebhookRecipient | undefined>;
  /** Возвращает HTTP-код фактического обработчика обновления. */
  deliver: (projectId: number, tokenId: number, body: string, secret: string) => Promise<number>;
}

/** Проверяет положительный десятичный идентификатор без частичного разбора строки. */
function parseId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Сравнивает секреты без утечки времени сравнения одинаковой длины. */
function secretMatches(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Создаёт обработчик, сохраняющий возможность повторной доставки Telegram при сбое. */
export function createTelegramWebhookHandler(dependencies: WebhookDependencies) {
  return async (req: Request, res: Response): Promise<void> => {
    const projectId = parseId(req.params.projectId);
    const tokenId = parseId(req.params.tokenId);
    if (projectId === null || tokenId === null || tokenId > 65535 - 9000) {
      res.status(400).end();
      return;
    }
    try {
      const recipient = await dependencies.getRecipient(tokenId);
      if (!recipient || recipient.projectId !== projectId || recipient.launchMode !== 'webhook') {
        res.status(404).end();
        return;
      }
      const secret = req.get('X-Telegram-Bot-Api-Secret-Token') ?? '';
      if (recipient.webhookSecretToken && !secretMatches(recipient.webhookSecretToken, secret)) {
        res.status(403).end();
        return;
      }
      const body = JSON.stringify(req.body);
      if (!body || Buffer.byteLength(body) > 1_048_576) {
        res.status(413).end();
        return;
      }
      const status = await dependencies.deliver(projectId, tokenId, body, secret);
      res.status(status >= 200 && status < 300 ? status : status === 401 || status === 403 ? status : 503).end();
    } catch {
      // Тело обновления и секрет не попадают в журнал при сетевом сбое.
      console.error(`[Webhook] Доставка недоступна: проект ${projectId}, бот ${tokenId}`);
      res.status(503).end();
    }
  };
}
