/**
 * @fileoverview Утилита удаления пользовательских данных
 *
 * Этот модуль предоставляет функцию для удаления данных
 * пользователей проекта из базы данных bot_users.
 *
 * @module projectManagement/utils/deleteProjectUserData
 */

import { pool as dbPool } from "../../../database/db";

/**
 * Удаляет пользовательские данные проекта из таблицы bot_users
 *
 * @param projectId - Идентификатор проекта
 * @returns Promise<void>
 */
export async function deleteProjectUserData(projectId: number): Promise<void> {
    try {
        await dbPool.query(
            `DELETE FROM bot_users WHERE project_id = $1`,
            [projectId]
        );
        console.log(`✅ Пользовательские данные удалены`);
    } catch (error) {
        console.error(`❌ Ошибка удаления пользовательских данных:`, error);
    }
}
