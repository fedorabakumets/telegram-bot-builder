/**
 * @fileoverview Проверка ответа Telegram перед запуском бота
 * @module server/bots/check-telegram-before-start
 */
import { getTelegramApiBaseUrl } from '../utils/telegram-api-url';
import { fetchWithProxy } from '../utils/telegram-proxy';
import { isTelegramMethodUnauthorized } from './telegram-method-unauthorized';

/** Поля ответа Telegram */
interface TelegramStartResponse {
  /** Признак успешного выполнения метода */
  ok?: boolean;
  /** Код ошибки Telegram */
  error_code?: number;
  /** Описание ошибки Telegram */
  description?: string;
}

/** Результат проверки Telegram перед запуском */
export interface TelegramStartCheck {
  /** Ответ Telegram подтверждает выполнение метода */
  ok: boolean;
  /** Telegram явно отклонил токен */
  unauthorized: boolean;
  /** Сообщение для пользователя без секретов */
  error?: string;
}

/**
 * Проверяет Telegram или отключает webhook непосредственно перед запуском polling.
 * @param token - Токен бота
 * @param method - Метод Telegram: проверка getMe или сброс webhook
 * @param request - Функция запроса для проверки без сети
 * @returns Результат проверки без раскрытия токена
 */
export async function checkTelegramBeforeStart(
  token: string,
  method: 'getMe' | 'deleteWebhook',
  request: typeof fetchWithProxy = fetchWithProxy,
): Promise<TelegramStartCheck> {
  const path = method === 'getMe' ? method : 'deleteWebhook?drop_pending_updates=false';
  try {
    const response = await request(`${getTelegramApiBaseUrl()}/bot${token}/${path}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => null) as TelegramStartResponse | null;
    if (isTelegramMethodUnauthorized(response.status, body)) {
      return { ok: false, unauthorized: true };
    }
    if (!response.ok || body?.ok !== true) {
      const code = typeof body?.error_code === 'number' ? body.error_code : response.status;
      return { ok: false, unauthorized: false, error: `Telegram отклонил проверку бота (код ${code}). Проверьте токен и доступ к Telegram.` };
    }
    return { ok: true, unauthorized: false };
  } catch {
    return { ok: false, unauthorized: false, error: 'Не удалось связаться с Telegram для проверки бота. Проверьте соединение и попробуйте снова.' };
  }
}
