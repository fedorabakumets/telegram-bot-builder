/**
 * @fileoverview Утилита удаления проекта
 *
 * Этот модуль предоставляет функцию для полного удаления проекта
 * и всех связанных данных.
 *
 * @module projectManagement/utils/projectDeleter
 */

import { stopProjectBot } from "./botStopper";
import { cleanupProjectData } from "./dataCleaner";
import { deleteBotFolder } from "./botFolderDeleter";
import { storage } from "../../../storages/storage";

/**
 * Выполняет полное удаление проекта
 *
 * @function deleteProject
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteProject(projectId: number): Promise<{ success: boolean; message: string }> {
    await stopProjectBot(projectId);
    await cleanupProjectData(projectId);
    await deleteBotFolder(projectId);

    console.log(`🗑️ Удаляем проект ${projectId} из базы данных`);
    const deleted = await storage.deleteBotProject(projectId);

    if (!deleted) {
        return { success: false, message: "Не удалось удалить проект из базы данных" };
    }

    console.log(`✅ Проект удален`);
    return { success: true, message: "Проект успешно удален" };
}
