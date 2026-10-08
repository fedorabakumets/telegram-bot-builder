/**
 * @fileoverview Запросы настройки юзербота с безопасным ответом для MCP.
 * @module lib/bot-tools/userbot-request-db
 */
import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/** Результат операции без секретов аккаунта */
export interface UserbotResult {
  /** Успешность шага */
  ok: boolean;
  /** Безопасный код ошибки */
  error?: string;
  /** Описание результата */
  message?: string;
  /** Требуется пароль второго фактора */
  needs_2fa?: boolean;
  /** Сохранённое состояние режима */
  userbotEnabled?: 0 | 1;
}

/** Допустимые ошибки авторизации и безопасные описания */
const AUTH_ERRORS: Record<string, string> = {
  invalid_code: 'Неверный код',
  code_expired: 'Код истёк, запросите новый',
  invalid_password: 'Неверный пароль',
  flood_wait: 'Telegram ограничил запросы. Повторите попытку позже',
  timeout: 'Таймаут авторизации',
  process_exit: 'Процесс авторизации завершился',
  exception: 'Ошибка авторизации Telegram',
  parse_error: 'Ошибка обработки команды авторизации',
};

/**
 * Выполняет запрос и выбирает только безопасные поля ответа.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param action - Суффикс пути авторизации или пустая строка для настроек
 * @param body - Данные запроса, которые не включаются в ошибки и логи
 * @param options - Параметры подключения к API
 * @returns Статус шага без сырых сообщений и секретов сервера
 */
export async function requestUserbotInDb(
  projectId: number, tokenId: number, action: string,
  body: Record<string, unknown>, options?: ReadDbOptions,
): Promise<UserbotResult> {
  try {
    const res = await apiFetch(`/api/projects/${projectId}/tokens/${tokenId}/userbot${action}`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: action ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}`, message: `Ошибка API: HTTP ${res.status}` };
    const raw: unknown = await res.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, error: 'invalid_response', message: 'Некорректный ответ API' };
    }
    const data = raw as Record<string, unknown>;
    if (!action) {
      if (data.success !== true || (data.userbotEnabled !== 0 && data.userbotEnabled !== 1)) {
        return { ok: false, error: 'invalid_response', message: 'Некорректный ответ API' };
      }
      return { ok: true, userbotEnabled: data.userbotEnabled, message: 'Настройки сохранены. Применятся при следующем запуске бота' };
    }
    if (typeof data.ok !== 'boolean' || (data.needs_2fa !== undefined && typeof data.needs_2fa !== 'boolean')) {
      return { ok: false, error: 'invalid_response', message: 'Некорректный ответ API' };
    }
    if (!data.ok) {
      const error = typeof data.error === 'string' && Object.prototype.hasOwnProperty.call(AUTH_ERRORS, data.error)
        ? data.error : 'auth_error';
      return { ok: false, error, message: AUTH_ERRORS[error] ?? 'Не удалось авторизовать аккаунт' };
    }
    return {
      ok: true,
      ...(data.needs_2fa !== undefined ? { needs_2fa: data.needs_2fa as boolean } : {}),
      message: action === '/send-code' ? 'Код отправлен'
        : data.needs_2fa ? 'Введите пароль 2FA'
          : 'Авторизация завершена. Настройки применятся при следующем запуске бота',
    };
  } catch {
    return { ok: false, error: 'request_failed', message: 'Не удалось выполнить запрос или разобрать ответ API' };
  }
}
