/**
 * @fileoverview Утилита удаления токенов проекта
 *
 * Этот модуль предоставляет функцию для удаления токенов
 * бота из базы данных.
 *
 * @module projectManagement/utils/deleteProjectTokens
 */

import { storage } from "../../../storages/storage";

/**
 * Удаляет токены проекта
 *
 * @function deleteProjectTokens
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function deleteProjectTokens(projectId: number): Promise<void> {
    try {
        const tokens = await storage.getBotTokensByProject(projectId);
        for (const token of tokens) {
            await storage.deleteBotToken(token.id);
        }
        console.log(`✅ Токены проекта удалены`);
    } catch (error) {
        console.error(`❌ Ошибка удаления токенов:`, error);
    }
}
