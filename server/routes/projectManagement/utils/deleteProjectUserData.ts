/**
 * @fileoverview Утилита удаления пользовательских данных
 *
 * Этот модуль предоставляет функцию для удаления данных
 * пользователей проекта из базы данных.
 *
 * @module projectManagement/utils/deleteProjectUserData
 */

import { storage } from "../../../storages/storage";

/**
 * Удаляет пользовательские данные проекта
 *
 * @function deleteProjectUserData
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function deleteProjectUserData(projectId: number): Promise<void> {
    try {
        const userData = await storage.getUserBotDataByProject(projectId);
        for (const data of userData) {
            await storage.deleteUserBotData(data.id);
        }
        console.log(`✅ Пользовательские данные удалены`);
    } catch (error) {
        console.error(`❌ Ошибка удаления пользовательских данных:`, error);
    }
}
