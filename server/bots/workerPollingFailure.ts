/** @fileoverview Проверяет отказ polling конкретного запуска и возвращает безопасную причину для панели. */
import { createHash } from 'node:crypto';

/** Структурированная диагностика исполнителя без произвольных описаний Telegram. */
interface PollingFailureEvent {
  /** Тип служебного события. */
  type: string;
  /** Код служебной причины. */
  code?: unknown;
  /** Источник отказа. */
  source?: unknown;
  /** Метод Bot API. */
  method?: unknown;
  /** Отпечаток секрета запуска. */
  tokenFingerprint?: unknown;
  /** Идентификатор запуска. */
  launch_id?: unknown;
  /** HTTP-код отказа Telegram. */
  telegram_code?: unknown;
  /** Известная классификация конфликта. */
  reason?: unknown;
}

/** Сопоставляет служебный отказ с текущим запуском, исключая поздние и поддельные события. */
export function resolveWorkerPollingFailure(event: PollingFailureEvent, token: string, launchId: number | undefined): string | undefined {
  if (!Number.isSafeInteger(launchId) || Number(launchId) <= 0 || event.launch_id !== launchId
    || event.type !== 'bot_runtime_error' || event.code !== 'telegram_polling_rejected'
    || event.source !== 'telegram_bot_api' || event.method !== 'getUpdates'
    || typeof event.tokenFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(event.tokenFingerprint)
    || createHash('sha256').update(token).digest('hex') !== event.tokenFingerprint
    || typeof event.telegram_code !== 'number' || ![400, 401, 403, 404, 409].includes(event.telegram_code)) return;
  if (event.telegram_code === 409 && event.reason === 'polling_conflict')
    return 'Telegram polling: конфликт 409 — другой процесс получает обновления этого бота';
  if (event.telegram_code === 409 && event.reason === 'webhook_conflict')
    return 'Telegram polling: конфликт 409 — у бота установлен webhook';
  if (event.reason === 'telegram_rejected') return `Telegram polling: отказ Bot API, код ${event.telegram_code}`;
  return undefined;
}

/** Не позволяет последующим сообщениям очистки затереть подтверждённый отказ polling. */
export function isWorkerPollingFailure(reason: string | undefined): boolean {
  return reason?.startsWith('Telegram polling: ') === true;
}
