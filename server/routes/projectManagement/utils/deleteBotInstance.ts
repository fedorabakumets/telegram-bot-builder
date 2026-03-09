/**
 * @fileoverview Утилита удаления экземпляра бота
 *
 * Этот модуль предоставляет функцию для удаления экземпляра
 * бота из базы данных.
 *
 * @module projectManagement/utils/deleteBotInstance
 */

import { storage } from "../../../storages/storage";

/**
 * Удаляет экземпляр бота
 *
 * @function deleteBotInstanceData
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function deleteBotInstanceData(projectId: number): Promise<void> {
    const botInstance = await storage.getBotInstance(projectId);
    if (botInstance) {
        console.log(`🗑️ Удаляем экземпляр бота ${botInstance.id}`);
        await storage.deleteBotInstance(botInstance.id);
        console.log(`✅ Экземпляр бота удален`);
    }
}
