/**
 * @fileoverview Утилита для получения информации о пользователе через Telegram API
 *
 * @module botIntegration/user/utils/getTelegramUser
 */

/**
 * Результат получения данных пользователя
 *
 * @typedef {Object} TelegramUserResult
 * @property {boolean} success - Успешность операции
 * @property {any} [data] - Данные пользователя (если успешно)
 * @property {string} [error] - Сообщение об ошибке (если неудачно)
 */

/**
 * Получает информацию о пользователе через Telegram API
 *
 * @function getTelegramUser
 * @param {string} token - Токен бота
 * @param {string} userId - ID пользователя
 * @returns {Promise<TelegramUserResult>} Результат запроса
 *
 * @description
 * Вызывает Telegram Bot API метод getChat для получения данных пользователя.
 */
export async function getTelegramUser(token: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const userResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userId
            })
        });

        const userResult = await userResponse.json();

        if (!userResponse.ok) {
            return {
                success: false,
                error: userResult.description || "Неизвестная ошибка"
            };
        }

        return {
            success: true,
            data: userResult.result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Неизвестная ошибка"
        };
    }
}
