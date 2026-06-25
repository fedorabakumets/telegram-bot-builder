/**
 * @fileoverview DTO элемента безопасного списка токенов бота: явный whitelist полей
 *
 * Вырезает секреты (token, webhookSecretToken, userbotApiHash, userbotSessionString)
 * у источника, чтобы они не попадали в ответ GET /api/projects/:id/tokens/list
 * ни браузеру, ни MCP-агенту. Используется явное перечисление полей (без spread),
 * чтобы новые секретные колонки не утекали автоматически в будущем.
 *
 * @module projectRoutes/bot-token-list-dto
 */

import type { BotToken } from "@shared/schema";

/**
 * Безопасный элемент списка токенов бота (без секрета token и прочих секретов)
 */
export interface BotTokenListItem {
    /** Уникальный идентификатор токена */
    id: number;
    /** Пользовательское имя токена */
    name: string;
    /** Имя пользователя бота (@username) из Telegram API */
    botUsername: string | null;
    /** Имя бота из Telegram API */
    botFirstName: string | null;
    /** Флаг токена по умолчанию (0 = нет, 1 = да) */
    isDefault: number | null;
    /** Флаг активности токена (0 = неактивен, 1 = активен) */
    isActive: number | null;
    /** Идентификатор проекта, которому принадлежит токен */
    projectId: number;
}

/**
 * Преобразует запись токена в безопасный элемент списка (явный whitelist)
 * @param token - Запись токена из хранилища
 * @returns Объект только с безопасными полями (без token и других секретов)
 */
export function toBotTokenListItem(token: BotToken): BotTokenListItem {
    return {
        id: token.id,
        name: token.name,
        botUsername: token.botUsername,
        botFirstName: token.botFirstName,
        isDefault: token.isDefault,
        isActive: token.isActive,
        projectId: token.projectId,
    };
}
