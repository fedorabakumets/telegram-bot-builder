/** @fileoverview Внутренний транспорт между панелью и владельцем клиента Telethon. */

/** Стабильная ошибка брокера без сетевых подробностей и реквизитов. */
export class ProjectTelegramBrokerError extends Error {
  /** Код для интерфейса и раннера. */
  readonly code: string;
  /** Безопасный HTTP-статус, отличающий лимит Telegram от недоступности сервиса. */
  readonly status: number;

  /**
   * Создаёт безопасную ошибку межсервисного вызова.
   * @param code - Код из разрешённого списка.
   */
  constructor(code: string) {
    super('Общий клиент Telegram не выполнил операцию');
    this.code = code;
    this.status = code === 'FLOOD_WAIT' || code === 'ACCOUNT_BUSY' ? 429
      : code === 'BROKER_TIMEOUT' ? 504
      : code === 'TELEGRAM_FAILED' ? 502
      : code === 'BROKER_FAILED' ? 500
      : ['NOT_AUTHORIZED', 'SESSION_REVOKED', 'AUTH_KEY_DUPLICATED', 'ACCOUNT_BLOCKED', 'ACCOUNT_CLOSING', 'EVENT_CURSOR_EXPIRED'].includes(code) ? 409
      : ['INVALID_REQUEST', 'INVALID_ARGS', 'UNSUPPORTED_OPERATION'].includes(code) ? 400 : 503;
  }
}

const safeCodes = new Set([
  'NOT_AUTHORIZED', 'SESSION_REVOKED', 'AUTH_KEY_DUPLICATED', 'FLOOD_WAIT',
  'INVALID_REQUEST', 'UNSUPPORTED_OPERATION', 'ACCOUNT_BUSY', 'BROKER_UNAVAILABLE',
  'ACCOUNT_BLOCKED', 'ACCOUNT_CLOSING', 'SESSION_IN_USE', 'CONFIG_CHANGED', 'BROKER_TIMEOUT',
  'INVALID_SESSION', 'INVALID_API', 'INVALID_PROXY', 'BUTTON_NOT_FOUND', 'INLINE_NOT_FOUND', 'SESSION_UNAUTHORIZED',
  'TELEGRAM_FAILED', 'BROKER_FAILED', 'INVALID_ARGS',
  'EVENT_CURSOR_EXPIRED',
]);

/**
 * Выполняет запрос к приватному брокеру без автоматических повторов.
 * @param operation - Операция внутреннего протокола.
 * @param payload - Параметры операции.
 * @returns Результат брокера.
 */
export async function callProjectTelegramBroker(
  operation: 'execute' | 'verify' | 'disconnect',
  payload: Record<string, unknown>,
): Promise<unknown> {
  const base = process.env.TELETHON_BROKER_URL?.trim();
  const secret = process.env.TELETHON_BROKER_SECRET?.trim();
  if (!base || !secret || Buffer.byteLength(secret) < 32) throw new ProjectTelegramBrokerError('BROKER_UNAVAILABLE');
  try {
    const url = new URL(`/v1/${operation}`, base);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
    const response = await fetch(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(65_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as { /** Результат операции. */ result?: unknown; /** Стабильный код ошибки. */ code?: string };
    /** Проверка собственного поля совместима с целевой библиотекой ES проекта. */
    if (!response.ok || !Object.prototype.hasOwnProperty.call(data, 'result')) {
      throw new ProjectTelegramBrokerError(data.code && safeCodes.has(data.code) ? data.code : 'BROKER_UNAVAILABLE');
    }
    return data.result;
  } catch (error) {
    if (error instanceof ProjectTelegramBrokerError) throw error;
    throw new ProjectTelegramBrokerError('BROKER_UNAVAILABLE');
  }
}
