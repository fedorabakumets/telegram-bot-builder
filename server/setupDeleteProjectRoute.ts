/**
 * @fileoverview Модуль для настройки маршрута удаления проекта
 *
 * Этот модуль предоставляет функцию для настройки маршрута удаления проекта,
 * включающую проверку прав доступа, остановку бота, удаление всех связанных
 * данных и файлов проекта.
 *
 * @module setupDeleteProjectRoute
 */

import type { Express } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getOwnerIdFromRequest } from "./auth-middleware";
import { stopBot } from "./stopBot";
import { storage } from "./storage";

/**
 * Настраивает маршрут удаления проекта
 *
 * @function setupDeleteProjectRoute
 * @param {Express} app - Экземпляр приложения Express
 * @param {Function} requireDbReady - Middleware для проверки готовности базы данных
 * @returns {void}
 *
 * @description
 * Функция устанавливает маршрут DELETE /api/projects/:id, который:
 * - Проверяет существование проекта
 * - Проверяет права доступа пользователя
 * - Останавливает запущенного бота (если есть)
 * - Удаляет все связанные данные (токены, медиафайлы, пользовательские данные)
 * - Удаляет папку проекта с файлами
 * - Удаляет сам проект из базы данных
 */
export function setupDeleteProjectRoute(app: Express, requireDbReady: (_req: any, res: any, next: any) => any) {
    /**
     * Обработчик маршрута DELETE /api/projects/:id
     *
     * Удаляет проект и все связанные с ним данные
     *
     * @route DELETE /api/projects/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Выполняет полное удаление проекта, включая:
     * - Проверку существования проекта
     * - Проверку прав доступа пользователя
     * - Остановку запущенного бота (если есть)
     * - Удаление экземпляра бота
     * - Удаление токенов проекта
     * - Удаление медиафайлов
     * - Удаление пользовательских данных
     * - Удаление папки проекта с файлами
     * - Удаление самого проекта из базы данных
     */
    app.delete("/api/projects/:id", requireDbReady, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            console.log(`🗑️ Начинаем удаление проекта ${id}`);

            // Сначала проверяем, существует ли проект
            const project = await storage.getBotProject(id);
            if (!project) {
                console.log(`❌ Проект ${id} не найден`);
                return res.status(404).json({ message: "Project not found" });
            }
            console.log(`✅ Проект ${id} найден: ${project.name}`);

            // Check ownership if user is authenticated
            const ownerId = getOwnerIdFromRequest(req);
            // Разрешаем удаление: если проект принадлежит пользователю ИЛИ это гостевой проект (ownerId=null)
            if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
                console.log(`❌ Пользователь ${ownerId} не имеет прав на удаление проекта ${id}`);
                return res.status(403).json({ message: "You don't have permission to delete this project" });
            }

            // Останавливаем бота, если он запущен
            try {
                const botInstance = await storage.getBotInstance(id);
                console.log(`🤖 Экземпляр бота для проекта ${id}:`, botInstance ? `ID: ${botInstance.id}, статус: ${botInstance.status}` : 'не найден');

                if (botInstance && botInstance.status === 'running') {
                    console.log(`🛑 Останавливаем бота ${id} перед удалением проекта...`);
                    await stopBot(id, botInstance.tokenId);
                    console.log(`✅ Бот ${id} остановлен`);
                }
            } catch (stopError) {
                console.error(`❌ Ошибка остановки бота ${id}:`, stopError);
                // Продолжаем удаление даже если остановка не удалась
            }

            // Удаляем связанные данные в правильном порядке
            try {
                // 1. Удаляем экземпляр бота из базы (если он существует)
                const botInstance = await storage.getBotInstance(id);
                if (botInstance) {
                    console.log(`🗑️ Удаляем экземпляр бота ${botInstance.id} для проекта ${id}`);
                    const instanceDeleted = await storage.deleteBotInstance(botInstance.id);
                    console.log(`${instanceDeleted ? '✅' : '❌'} Экземпляр бота ${instanceDeleted ? 'удален' : 'не удален'}`);
                }

                // 2. Удаляем все токены проекта (CASCADE должен сработать автоматически)
                try {
                    console.log(`🗑️ Удаляем токены проекта ${id}`);
                    const tokens = await storage.getBotTokensByProject(id);
                    for (const token of tokens) {
                        await storage.deleteBotToken(token.id);
                    }
                    console.log(`✅ Токены проекта ${id} удалены`);
                } catch (tokenError) {
                    console.error(`❌ Ошибка удаления токенов:`, tokenError);
                }

                // 3. Удаляем медиафайлы
                try {
                    console.log(`🗑️ Удаляем медиафайлы проекта ${id}`);
                    const mediaFiles = await storage.getMediaFilesByProject(id);
                    for (const mediaFile of mediaFiles) {
                        await storage.deleteMediaFile(mediaFile.id);
                    }
                    console.log(`✅ Медиафайлы проекта ${id} удалены`);
                } catch (mediaError) {
                    console.error(`❌ Ошибка удаления медиафайлов:`, mediaError);
                }

                // 4. Удаляем пользовательские данные
                try {
                    console.log(`🗑️ Удаляем пользовательские данные проекта ${id}`);
                    const userData = await storage.getUserBotDataByProject(id);
                    for (const data of userData) {
                        await storage.deleteUserBotData(data.id);
                    }
                    console.log(`✅ Пользовательские данные проекта ${id} удалены`);
                } catch (userDataError) {
                    console.error(`❌ Ошибка удаления пользовательских данных:`, userDataError);
                }

                // 5. Удаляем папку бота со всеми файлами
                const botsDir = join(process.cwd(), 'bots');

                // Удаляем папку бота, если она существует
                const fs = await import('fs');
                const path = await import('path');


                // Проверяем, существует ли папка бота
                // Найдем все папки, соответствующие шаблону bot_{id}_*
                if (existsSync(botsDir)) {
                    const allFiles = fs.readdirSync(botsDir);
                    const botDirs = allFiles.filter(file => file.startsWith(`bot_${id}_`)
                    );

                    for (const botDirName of botDirs) {
                        const botDirPath = path.join(botsDir, botDirName);

                        try {
                            // Удаляем папку рекурсивно, используя fs.rm с опцией recursive
                            await fs.promises.rm(botDirPath, { recursive: true, force: true });

                            console.log(`✅ Папка бота удалена: ${botDirPath}`);
                        } catch (err) {
                            console.error(`❌ Ошибка удаления папки ${botDirPath}:`, err);
                        }
                    }

                    if (botDirs.length === 0) {
                        console.log(`📄 Нет папок бота для проекта ${id}`);
                    } else {
                        console.log(`🗑️ Удалено ${botDirs.length} папок бота для проекта ${id}`);
                    }
                } else {
                    console.log(`📄 Директория bots не существует`);
                }
            } catch (cleanupError) {
                console.error(`❌ Ошибка очистки данных бота ${id}:`, cleanupError);
                // Продолжаем удаление проекта
            }

            // Удаляем проект
            console.log(`🗑️ Удаляем проект ${id} из базы данных`);
            const deleted = await storage.deleteBotProject(id);
            console.log(`${deleted ? '✅' : '❌'} Проект ${deleted ? 'удален' : 'не удален'} из базы данных`);

            if (!deleted) {
                return res.status(500).json({ message: "Failed to delete project from database" });
            }

            console.log(`🎉 Проект ${id} успешно удален`);
            return res.json({ message: "Project deleted successfully" });
        } catch (error) {
            console.error("❌ Критическая ошибка удаления проекта:", error);
            console.error("❌ Стек ошибки:", error instanceof Error ? error.stack : 'Unknown error');
            return res.status(500).json({ message: "Failed to delete project", error: error instanceof Error ? error.message : String(error) });
        }
    });
}
