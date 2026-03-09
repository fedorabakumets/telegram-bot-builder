/**
 * @fileoverview Утилита для определения ID пользователя по username или numeric ID
 *
 * @module botIntegration/user/utils/resolveUserId
 */

/**
 * Определяет ID пользователя по запросу (username или numeric ID)
 *
 * @function resolveUserId
 * @param {string} token - Токен бота
 * @param {string} query - Поисковый запрос (username или ID)
 * @returns {Promise<string | null>} ID пользователя или null
 *
 * @description
 * Если query числовой - возвращает как есть.
 * Если username - пытается получить ID через Telegram API (@username).
 */
export async function resolveUserId(token: string, query: string): Promise<string | null> {
    // Если числовой ID - возвращаем как есть
    if (/^\d+$/.test(query)) {
        return query;
    }

    // Если username - пробуем получить через @username
    const username = query.startsWith('@') ? query.slice(1) : query;

    try {
        const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: `@${username}`
            })
        });

        const chatResult = await chatResponse.json();
        if (chatResponse.ok && chatResult.result && chatResult.result.id) {
            return chatResult.result.id.toString();
        }
    } catch (error) {
        console.log('Поиск по username не удался, у пользователя может не быть публичного username');
    }

    return null;
}
