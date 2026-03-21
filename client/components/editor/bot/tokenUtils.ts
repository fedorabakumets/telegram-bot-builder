/**
 * @fileoverview Утилиты для работы с токенами
 *
 * Содержит функции для маскировки и валидации токенов.
 *
 * @module tokenUtils
 */

/**
 * Маскировка токена — полностью скрывает значение
 * @param token - Токен для маскировки
 * @returns Строка из звёздочек той же длины
 */
export function maskToken(token: string): string {
  return '*'.repeat(token.length);
}

/**
 * Валидация токена через Telegram API
 * @param token - Токен бота для валидации
 * @returns true, если токен действителен
 */
export async function validateBotToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      return false;
    }

    const responseText = await response.text();

    if (!responseText.trim().startsWith('{')) {
      console.error('Ответ не является JSON:', responseText);
      return false;
    }

    const data = JSON.parse(responseText);
    return data.ok;
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return false;
  }
}
