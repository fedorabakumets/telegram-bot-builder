/**
 * @fileoverview Утилита для обработки ошибок Telegram
 *
 * Предоставляет функции для красивого логирования и обработки
 * распространённых ошибок Telegram API.
 *
 * @module telegram-error-handler
 */

/**
 * Анализирует ошибку Telegram и возвращает структурированную информацию
 * @param error - Объект ошибки
 * @returns Объект с информацией об ошибке для ответа клиенту
 */
export function analyzeTelegramError(error: any): {
  type: string;
  message: string;
  userFriendlyMessage: string;
} {
  const errorMessage = error?.message || String(error);

  // TIMEOUT ошибка
  if (errorMessage.includes('TIMEOUT') || errorMessage.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      message: errorMessage,
      userFriendlyMessage: 'Превышено время ожидания ответа от Telegram. Попробуйте позже.'
    };
  }

  // Ошибка соединения
  if (errorMessage.includes('ECONNRESET') || errorMessage.includes('Connection') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ENOTFOUND')) {
    return {
      type: 'CONNECTION_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Ошибка соединения с Telegram. Проверьте интернет-соединение.'
    };
  }

  // Ошибка авторизации (неверный токен и т.д.)
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('invalid token')) {
    return {
      type: 'AUTH_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Ошибка авторизации. Проверьте токен бота.'
    };
  }

  // Flood wait
  if (errorMessage.includes('FLOOD_WAIT')) {
    return {
      type: 'FLOOD_WAIT',
      message: errorMessage,
      userFriendlyMessage: 'Слишком много запросов. Подождите немного.'
    };
  }

  // Ошибка бота (бот заблокирован и т.д.)
  if (errorMessage.includes('bot was blocked') || errorMessage.includes('bot can\'t initiate conversation')) {
    return {
      type: 'BOT_BLOCKED',
      message: errorMessage,
      userFriendlyMessage: 'Бот не может отправить сообщение этому пользователю.'
    };
  }

  // Ошибка по умолчанию
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    userFriendlyMessage: 'Произошла ошибка при выполнении операции.'
  };
}

/**
 * Возвращает HTTP статус код для типа ошибки Telegram
 * @param type - Тип ошибки
 * @returns HTTP статус код
 */
export function getErrorStatusCode(type: string): number {
  switch (type) {
    case 'TIMEOUT':
      return 504; // Gateway Timeout
    case 'CONNECTION_ERROR':
      return 503; // Service Unavailable
    case 'AUTH_ERROR':
      return 401; // Unauthorized
    case 'FLOOD_WAIT':
      return 429; // Too Many Requests
    case 'BOT_BLOCKED':
      return 400; // Bad Request
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Обрабатывает ошибку Telegram и возвращает красивое сообщение
 * @param error - Объект ошибки
 * @param context - Контекст возникновения ошибки (для логирования)
 * @returns Объект с информацией об ошибке для ответа клиенту
 */
export function handleTelegramError(error: any, context: string = 'Telegram operation') {
  const errorMessage = error?.message || String(error);
  
  // Обрабатываем ошибку TIMEOUT
  if (errorMessage.includes('TIMEOUT') || errorMessage.includes('timeout')) {
    console.warn(`⏱️ ${context}: TIMEOUT - Превышено время ожидания`);
    return {
      success: false,
      error: 'Превышено время ожидания ответа от Telegram. Попробуйте позже.',
      retryAfter: 5,
      code: 'TIMEOUT'
    };
  }
  
  // Обрабатываем ошибку соединения
  if (errorMessage.includes('ECONNRESET') || errorMessage.includes('Connection')) {
    console.warn(`🔌 ${context}: Ошибка соединения - ${errorMessage}`);
    return {
      success: false,
      error: 'Ошибка соединения с Telegram. Проверьте интернет-соединение.',
      retryAfter: 3,
      code: 'CONNECTION_ERROR'
    };
  }
  
  // Обрабатываем ошибку авторизации
  if (errorMessage.includes('SESSION') || errorMessage.includes('AUTH')) {
    console.warn(`🔐 ${context}: Ошибка авторизации - ${errorMessage}`);
    return {
      success: false,
      error: 'Ошибка авторизации. Требуется повторный вход.',
      requiresAuth: true,
      code: 'AUTH_ERROR'
    };
  }
  
  // Обрабатываем ошибку flood wait
  if (errorMessage.includes('FLOOD_WAIT') || errorMessage.includes(' flood ')) {
    const waitTime = errorMessage.match(/\d+/)?.[0] || '5';
    console.warn(`🌊 ${context}: FLOOD_WAIT - Подождите ${waitTime}с`);
    return {
      success: false,
      error: `Слишком много запросов. Подождите ${waitTime} секунд.`,
      retryAfter: parseInt(waitTime),
      code: 'FLOOD_WAIT'
    };
  }
  
  // Логгируем остальные ошибки
  console.error(`❌ ${context}: ${errorMessage}`);
  return {
    success: false,
    error: errorMessage,
    code: 'UNKNOWN_ERROR'
  };
}
