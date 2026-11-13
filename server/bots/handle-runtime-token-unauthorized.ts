/** @fileoverview Сохраняет подтверждённый отказ Bot API с защитой от замены секрета. */
import { createHash } from 'node:crypto';
import { storage } from '../storages/storage';
import { markBotTokenUnauthorized } from './mark-bot-token-unauthorized';

/** Поля структурированного отказа, полученного от исполнителя. */
export interface RuntimeAuthorizationError {
  /** Вид события. */
  type?: unknown;
  /** Код подтверждённой ошибки Telegram. */
  code?: unknown;
  /** Источник ответа. */
  source?: unknown;
  /** Вызывавшийся метод Bot API. */
  method?: unknown;
  /** Отпечаток секрета, использованного в запросе. */
  tokenFingerprint?: unknown;
  /** Идентификатор запуска, зафиксированный при выполнении запроса. */
  launch_id?: unknown;
}

/**
 * Помечает только ту версию токена, которую действительно отклонил Telegram.
 * @param projectId - Проект завершившегося запроса
 * @param tokenId - Идентификатор токена
 * @param event - Структурированная ошибка исполнителя
 * @returns Завершение атомарного обновления или безопасный пропуск
 */
export async function handleRuntimeTokenUnauthorized(projectId: number, tokenId: number, event: RuntimeAuthorizationError): Promise<void> {
  const current = await storage.getBotToken(tokenId);
  if (!current?.token || current.projectId !== projectId || !isRuntimeAuthorizationForToken(event, current.token)) return;
  await markBotTokenUnauthorized(projectId, tokenId, current.token);
}

/**
 * Сверяет структурированный отказ с секретом конкретного запуска без обращения к БД.
 * @param event - Ошибка исполнителя
 * @param token - Секрет запуска
 * @param code - Ожидаемый код подтверждённого отказа Telegram
 * @returns Подтверждение принадлежности отказа этому запуску
 */
export function isRuntimeAuthorizationForToken(event: RuntimeAuthorizationError, token: string, code = 'telegram_unauthorized'): boolean {
  if (event.type !== 'bot_runtime_error' || event.code !== code
    || event.source !== 'telegram_bot_api' || typeof event.method !== 'string'
    || !/^[a-z][a-zA-Z]+$/.test(event.method) || typeof event.tokenFingerprint !== 'string'
    || !/^[a-f0-9]{64}$/.test(event.tokenFingerprint)) return false;
  return createHash('sha256').update(token).digest('hex') === event.tokenFingerprint;
}
