/**
 * @fileoverview Утилита удаления папки бота
 *
 * Этот модуль предоставляет функцию для удаления файловой
 * папки проекта с ботом.
 *
 * @module projectManagement/utils/botFolderDeleter
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Удаляет папку бота с файлами
 *
 * @function deleteBotFolder
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<void>}
 */
export async function deleteBotFolder(projectId: number): Promise<void> {
    const fs = await import('fs');

    const botsDir = join(process.cwd(), 'bots');
    if (!existsSync(botsDir)) {
        console.log(`📄 Директория bots не существует`);
        return;
    }

    const allFiles = fs.readdirSync(botsDir);
    const botDirs = allFiles.filter(file => file.startsWith(`bot_${projectId}_`));

    if (botDirs.length === 0) {
        console.log(`📄 Нет папок бота для проекта ${projectId}`);
        return;
    }

    for (const botDirName of botDirs) {
        const botDirPath = join(botsDir, botDirName);
        try {
            await fs.promises.rm(botDirPath, { recursive: true, force: true });
            console.log(`✅ Папка бота удалена: ${botDirPath}`);
        } catch (error) {
            console.error(`❌ Ошибка удаления папки ${botDirPath}:`, error);
        }
    }

    console.log(`🗑️ Удалено ${botDirs.length} папок бота`);
}
