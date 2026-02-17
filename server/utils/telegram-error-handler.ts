/**
 * Утилита для обработки ошибок Telegram Bot API
 */

export class TelegramAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'TelegramAPIError';
  }
}

export type TelegramErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INVALID_TOKEN'
  | 'BOT_BLOCKED'
  | 'CHAT_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export interface TelegramErrorResponse {
  message: string;
  type: TelegramErrorType;
  userFriendlyMessage: string;
  originalError?: unknown;
}

/**
 * Анализирует ошибку и возвращает понятное описание
 */
export function analyzeTelegramError(error: unknown): TelegramErrorResponse {
  // Сетевые ошибки
  if (error instanceof Error) {
    // Таймаут соединения
    if (error.message.includes('ETIMEDOUT') || 
        error.message.includes('UND_ERR_CONNECT_TIMEOUT') ||
        error.message.includes('Connect Timeout Error')) {
      return {
        message: error.message,
        type: 'TIMEOUT_ERROR',
        userFriendlyMessage: 'Превышено время ожидания ответа от Telegram API. Проверьте подключение к интернету.',
        originalError: error
      };
    }

    // Ошибки подключения
    if (error.message.includes('ENOTFOUND') || 
        error.message.includes('getaddrinfo')) {
      return {
        message: error.message,
        type: 'NETWORK_ERROR',
        userFriendlyMessage: 'Не удалось подключиться к Telegram API. Проверьте DNS и подключение к интернету.',
        originalError: error
      };
    }

    // Ошибка сертификата
    if (error.message.includes('CERT_')) {
      return {
        message: error.message,
        type: 'NETWORK_ERROR',
        userFriendlyMessage: 'Ошибка SSL-сертификата. Возможно, требуется обновление корневых сертификатов.',
        originalError: error
      };
    }

    // Ошибка fetch
    if (error.message.includes('fetch failed') || error.message.includes('UND_ERR')) {
      return {
        message: error.message,
        type: 'NETWORK_ERROR',
        userFriendlyMessage: 'Ошибка подключения к Telegram API. Проверьте подключение к интернету и настройки брандмауэра.',
        originalError: error
      };
    }
  }

  // Ошибки от самого Telegram API
  if (typeof error === 'object' && error !== null && 'error_code' in error) {
    const telegramError = error as { error_code: number; description?: string };
    
    switch (telegramError.error_code) {
      case 401:
        return {
          message: telegramError.description || 'Unauthorized',
          type: 'INVALID_TOKEN',
          userFriendlyMessage: 'Неверный токен бота. Проверьте токен в настройках.',
          originalError: error
        };
      case 403:
        return {
          message: telegramError.description || 'Forbidden',
          type: 'BOT_BLOCKED',
          userFriendlyMessage: 'Бот заблокирован пользователем.',
          originalError: error
        };
      case 404:
        return {
          message: telegramError.description || 'Not Found',
          type: 'CHAT_NOT_FOUND',
          userFriendlyMessage: 'Чат не найден.',
          originalError: error
        };
      case 429:
        return {
          message: telegramError.description || 'Too Many Requests',
          type: 'RATE_LIMITED',
          userFriendlyMessage: 'Слишком много запросов. Попробуйте позже.',
          originalError: error
        };
      default:
        return {
          message: telegramError.description || 'Unknown Telegram error',
          type: 'UNKNOWN_ERROR',
          userFriendlyMessage: `Ошибка Telegram API: ${telegramError.description || 'Неизвестная ошибка'}`,
          originalError: error
        };
    }
  }

  // Неизвестная ошибка
  return {
    message: error instanceof Error ? error.message : String(error),
    type: 'UNKNOWN_ERROR',
    userFriendlyMessage: 'Произошла неизвестная ошибка при подключении к Telegram API.',
    originalError: error
  };
}

/**
 * Выполняет fetch-запрос к Telegram API с обработкой ошибок
 */
export async function fetchWithTelegramErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: TelegramErrorResponse }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const result = await response.json() as T | { ok: false; error_code: number; description: string };

    if (!response.ok) {
      const errorResponse = analyzeTelegramError(result);
      return { success: false, error: errorResponse };
    }

    return { success: true, data: result as T };
  } catch (error) {
    const errorResponse = analyzeTelegramError(error);
    return { success: false, error: errorResponse };
  }
}

/**
 * Возвращает HTTP статус для типа ошибки
 */
export function getErrorStatusCode(errorType: TelegramErrorType): number {
  switch (errorType) {
    case 'INVALID_TOKEN':
      return 401;
    case 'BOT_BLOCKED':
    case 'CHAT_NOT_FOUND':
      return 404;
    case 'RATE_LIMITED':
      return 429;
    case 'TIMEOUT_ERROR':
    case 'NETWORK_ERROR':
      return 503; // Service Unavailable
    default:
      return 500;
  }
}
