/** @fileoverview Закрытый транспорт обновлений Telegram между API и исполнителем. */
import { runtimeEnv } from '../services/runtime-overlay';

/** Проверенные параметры доставки обновления. */
export interface TelegramWebhookDelivery {
  /** Проект адресата. */
  projectId: number;
  /** Токен адресата. */
  tokenId: number;
  /** Сериализованное обновление. */
  body: string;
  /** Проверенный заголовок Telegram. */
  secret: string;
  /** Исполнитель находится вне API. */
  remote: boolean;
}

/** Адрес закрытого транспорта и его отдельные полномочия. */
export interface WebhookDeliveryTarget {
  /** Адрес фиксированного внутреннего маршрута. */
  url: string;
  /** Полномочия API для обращения к исполнителю. */
  authorization?: string;
}

/** Формирует адрес только из серверной конфигурации, исключая URL из настроек бота. */
export function webhookDeliveryTarget(input: TelegramWebhookDelivery): WebhookDeliveryTarget {
  if (!input.remote) return { url: `http://127.0.0.1:${9000 + input.tokenId}/webhook` };
  const configured = runtimeEnv('RUNNER_WEBHOOK_URL');
  const credential = runtimeEnv('RUNNER_WEBHOOK_SECRET');
  if (!configured || !credential) throw new Error('Не настроен закрытый транспорт webhook');
  const base = new URL(configured);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash
      || (base.pathname !== '/' && base.pathname !== '')) throw new Error('Некорректный адрес исполнителя');
  base.pathname = `/internal/webhook/${input.projectId}/${input.tokenId}`;
  return { url: base.toString(), authorization: `Bearer ${credential}` };
}

/** Дожидается ответа обработчика; сетевые ошибки вызывают повторную доставку Telegram. */
export async function deliverTelegramWebhook(input: TelegramWebhookDelivery): Promise<number> {
  const target = webhookDeliveryTarget(input);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (input.secret) headers['X-Telegram-Bot-Api-Secret-Token'] = input.secret;
  if (target.authorization) headers.Authorization = target.authorization;
  const response = await fetch(target.url, {
    method: 'POST', headers, body: input.body, redirect: 'error', signal: AbortSignal.timeout(50_000),
  });
  await response.body?.cancel();
  return response.status;
}
