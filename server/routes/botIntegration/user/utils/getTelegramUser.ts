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
    const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
    const startTime = Date.now();
    
    console.log(`[Telegram API] Getting user ${userId}, token: ${maskedToken}`);
    
    try {
        const userResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userId
            }),
            signal: AbortSignal.timeout(10000)
        });

        const duration = Date.now() - startTime;
        console.log(`[Telegram API] User response: ${userResponse.status} (${duration}ms)`);

        const userResult = await userResponse.json();

        if (!userResponse.ok) {
            console.warn(`[Telegram API] Failed to get user ${userId}: ${userResult.description || 'Unknown error'}`);
            return {
                success: false,
                error: userResult.description || "Неизвестная ошибка"
            };
        }

        console.log(`[Telegram API] User data retrieved: ${userResult.result?.first_name || 'Unknown'}`);
        return {
            success: true,
            data: userResult.result
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCause = error instanceof Error && 'cause' in error 
            ? (error.cause as Error)?.message || error.cause 
            : 'No cause';
        
        console.error(`[Telegram API] Failed to get user ${userId}:`);
        console.error(`  - Error: ${errorMessage}`);
        console.error(`  - Cause: ${errorCause}`);
        console.error(`  - Time: ${duration}ms`);
        
        return {
            success: false,
            error: error.message || "Неизвестная ошибка"
        };
    }
}
