/**
 * @fileoverview Утилита удаления медиафайлов проекта
 *
 * Этот модуль предоставляет функцию для удаления медиафайлов
 * проекта из базы данных.
 *
 * @module projectManagement/utils/deleteProjectMedia
 */

import { storage } from "../../../storages/storage";

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
