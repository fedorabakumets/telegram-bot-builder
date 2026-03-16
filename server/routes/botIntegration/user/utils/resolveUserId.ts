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
    const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';

    console.log(`[Telegram API] Resolving user ${username}, token: ${maskedToken}`);
    const startTime = Date.now();

    try {
        const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: `@${username}`
            }),
            signal: AbortSignal.timeout(10000)
        });

        const duration = Date.now() - startTime;
        console.log(`[Telegram API] Resolve user response: ${chatResponse.status} (${duration}ms)`);

        const chatResult = await chatResponse.json();
        if (chatResponse.ok && chatResult.result && chatResult.result.id) {
            console.log(`[Telegram API] User resolved: ${chatResult.result.id}`);
            return chatResult.result.id.toString();
        } else {
            console.warn(`[Telegram API] User ${username} not found: ${chatResult.description || 'Unknown error'}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCause = error instanceof Error && 'cause' in error 
            ? (error.cause as Error)?.message || error.cause 
            : 'No cause';
        
        console.warn(`[Telegram API] Failed to resolve user ${username}:`);
        console.warn(`  - Error: ${errorMessage}`);
        console.warn(`  - Cause: ${errorCause}`);
        console.warn('  - Possible: User has no public username or Telegram API unreachable');
    }

    return null;
}
