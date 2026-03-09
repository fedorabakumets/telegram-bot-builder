/**
 * @fileoverview Утилита остановки бота проекта
 *
 * Этот модуль предоставляет функцию для остановки бота
 * перед удалением проекта.
 *
 * @module projectManagement/utils/botStopper
 */

import { stopBot } from "../../../bots/stopBot";
import { storage } from "../../../storages/storage";

/**
 * Останавливает бота проекта если он запущен
 *
 * @function stopProjectBot
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function stopProjectBot(projectId: number): Promise<void> {
    try {
        const botInstance = await storage.getBotInstance(projectId);

        if (botInstance && botInstance.status === 'running') {
            console.log(`🛑 Останавливаем бота ${projectId}...`);
            await stopBot(projectId, botInstance.tokenId);
            console.log(`✅ Бот ${projectId} остановлен`);
        }
    } catch (error) {
        console.error(`❌ Ошибка остановки бота ${projectId}:`, error);
    }
}
