/**
 * @fileoverview Утилиты для валидации токена бота
 *
 * Содержит функции для проверки валидности токенов Telegram ботов.
 *
 * @module tokenValidation
 */

/**
 * Валидация токена через Telegram API
 * @param token - Токен бота для валидации
 * @returns {Promise<boolean>} - Возвращает true, если токен действителен
 */
export async function validateBotToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);

    // Проверяем статус ответа
    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      return false;
    }

    // Получаем текст ответа
    const responseText = await response.text();

    // Проверяем, начинается ли ответ с JSON объекта
    if (!responseText.trim().startsWith('{')) {
      console.error('Ответ не является JSON:', responseText);
      return false;
    }

    try {
      const data = JSON.parse(responseText);
      return data.ok;
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return false;
    }
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return false;
  }
}
