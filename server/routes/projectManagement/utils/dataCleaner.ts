/**
 * @fileoverview Утилита очистки данных проекта из БД
 *
 * Этот модуль предоставляет функции для удаления связанных
 * данных проекта из базы данных.
 *
 * @module projectManagement/utils/dataCleaner
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

/**
 * Удаляет медиафайлы проекта
 *
 * @function deleteProjectMedia
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function deleteProjectMedia(projectId: number): Promise<void> {
    try {
        const mediaFiles = await storage.getMediaFilesByProject(projectId);
        for (const mediaFile of mediaFiles) {
            await storage.deleteMediaFile(mediaFile.id);
        }
        console.log(`✅ Медиафайлы проекта удалены`);
    } catch (error) {
        console.error(`❌ Ошибка удаления медиафайлов:`, error);
    }
}

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

/**
 * Очищает все связанные данные проекта
 *
 * @function cleanupProjectData
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function cleanupProjectData(projectId: number): Promise<void> {
    await deleteBotInstanceData(projectId);
    await deleteProjectTokens(projectId);
    await deleteProjectMedia(projectId);
    await deleteProjectUserData(projectId);
}
