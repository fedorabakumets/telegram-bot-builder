/**
 * @fileoverview Утилита очистки данных проекта из БД
 *
 * Этот модуль предоставляет функцию для очистки всех связанных
 * данных проекта из базы данных.
 *
 * @module projectManagement/utils/dataCleaner
 */

import { deleteBotInstanceData } from "./deleteBotInstance";
import { deleteProjectTokens } from "./deleteProjectTokens";
import { deleteProjectMedia } from "./deleteProjectMedia";
import { deleteProjectUserData } from "./deleteProjectUserData";

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
