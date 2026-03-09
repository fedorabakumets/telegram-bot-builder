/**
 * @fileoverview Утилита для поиска пользователя в локальной базе данных
 *
 * @module botIntegration/user/utils/searchLocalDatabase
 */

/**
 * Результат поиска в локальной базе
 *
 * @typedef {Object} LocalSearchResult
 * @property {boolean} found - Найден ли пользователь
 * @property {any} [data] - Данные пользователя (если найден)
 */

/**
 * Ищет пользователя в локальных таблицах user_bot_data и bot_users
 *
 * @function searchLocalDatabase
 * @param {any[]} userBotData - Данные из таблицы user_bot_data
 * @param {any[]} botUsers - Данные из таблицы bot_users
 * @returns {LocalSearchResult} Результат поиска
 *
 * @description
 * Проверяет сначала user_bot_data (проект-специфичные данные),
 * затем bot_users (глобальная таблица пользователей).
 */
export function searchLocalDatabase(userBotData: any[], botUsers: any[]): { found: boolean; data?: any } {
    // Проверяем user_bot_data (специфично для проекта)
    if (userBotData && userBotData.length > 0) {
        const user = userBotData[0];
        return {
            found: true,
            data: {
                success: true,
                user: {
                    id: parseInt(user.userId),
                    first_name: user.firstName,
                    last_name: user.lastName,
                    username: user.userName,
                    type: 'private'
                },
                userId: user.userId,
                source: 'local_project'
            }
        };
    }

    // Проверяем bot_users (глобальная таблица пользователей)
    if (botUsers && botUsers.length > 0) {
        const user = botUsers[0];
        return {
            found: true,
            data: {
                success: true,
                user: {
                    id: user.userId,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    username: user.username,
                    type: 'private'
                },
                userId: user.userId.toString(),
                source: 'local_global'
            }
        };
    }

    return { found: false };
}
