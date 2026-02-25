/**
 * @fileoverview Модуль для настройки маршрутов управления ботами
 *
 * Этот модуль предоставляет функции для настройки маршрутов управления жизненным
 * циклом ботов, включая запуск, остановку, перезапуск и проверку статуса.
 *
 * @module setupBotManagementRoutes
 */

import type { Express } from 'express';
import { findActiveProcessForProject } from '../utils/findActiveProcessForProject';
import { botProcesses } from '../routes/routes';
import { startBot } from '../bots/startBot';
import { stopBot } from '../bots/stopBot';
import { storage } from '../storages/storage';

/**
 * Настраивает маршруты управления ботами
 *
 * @function setupBotManagementRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/projects/:id/bot - получение статуса бота
 * - POST /api/projects/:id/bot/start - запуск бота
 * - POST /api/projects/:id/bot/stop - остановка бота
 * - POST /api/projects/:id/bot/restart - перезапуск бота
 */
export function setupBotManagementRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/projects/:id/bot
     *
     * Возвращает статус бота для указанного проекта
     *
     * @route GET /api/projects/:id/bot
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет статус бота в базе данных и в системе, сравнивает их и при необходимости
     * корректирует статус в базе данных. Возвращает объект с текущим статусом и информацией
     * об экземпляре бота.
     */
    app.get("/api/projects/:id/bot", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const instance = await storage.getBotInstance(projectId);
            if (!instance) {
                return res.json({ status: 'stopped', instance: null });
            }

            // Проверяем соответствие состояния в базе и в памяти
            const activeProcessInfo = findActiveProcessForProject(projectId);
            let actualStatus = 'stopped';

            // Если есть активный процесс в памяти
            if (activeProcessInfo) {
                actualStatus = 'running';
            }

            // Проверяем существует ли процесс по PID (независимо от статуса в базе)
            if (!activeProcessInfo && instance.processId) {
                try {
                    // Проверяем существование процесса (не убиваем, только проверяем)
                    if (process.platform === 'win32') {
                        // На Windows используем tasklist для проверки процесса
                        const { execSync } = require('child_process');
                        const result = execSync(`tasklist /FI "PID eq ${instance.processId}" /FO CSV`, { encoding: 'utf8' });
                        if (!result.includes(instance.processId)) {
                            throw new Error('Process not found');
                        }
                    } else {
                        // На Unix системах используем kill -0
                        process.kill(parseInt(instance.processId), 0);
                    }
                    console.log(`Процесс ${instance.processId} для бота ${projectId} найден в системе, восстанавливаем отслеживание`);

                    // Создаем фиктивный объект процесса для отслеживания
                    const mockProcess = {
                        pid: parseInt(instance.processId),
                        killed: false,
                        exitCode: null,
                        kill: (signal: any) => {
                            try {
                                process.kill(parseInt(instance.processId!), signal);
                                return true;
                            } catch {
                                return false;
                            }
                        }
                    } as any;

                    // Восстанавливаем отслеживание процесса (используем tokenId из экземпляра)
                    if (instance.tokenId) {
                        const processKey = `${projectId}_${instance.tokenId}`;
                        botProcesses.set(processKey, mockProcess);
                    }
                    actualStatus = 'running';
                } catch (error) {
                    actualStatus = 'stopped';
                }
            }

            // Дополнительная проверка через ps/tasklist для более точного определения
            if (!activeProcessInfo && instance.processId && actualStatus === 'stopped') {
                try {
                    const { execSync } = require('child_process');
                    let psOutput = '';

                    if (process.platform === 'win32') {
                        psOutput = execSync(`tasklist /FI "PID eq ${instance.processId}" /FO CSV`, { encoding: 'utf8' }).trim();
                    } else {
                        psOutput = execSync(`ps -p ${instance.processId} -o pid,ppid,cmd --no-headers`, { encoding: 'utf8' }).trim();
                    }

                    if (psOutput && psOutput.includes('python')) {
                        // Создаем фиктивный объект процесса для отслеживания
                        const mockProcess = {
                            pid: parseInt(instance.processId),
                            killed: false,
                            exitCode: null,
                            kill: (signal: any) => {
                                try {
                                    process.kill(parseInt(instance.processId!), signal);
                                    return true;
                                } catch {
                                    return false;
                                }
                            }
                        } as any;

                        // Восстанавливаем отслеживание процесса
                        botProcesses.set(`${projectId}_${instance.tokenId}`, mockProcess);
                        actualStatus = 'running';
                    }
                } catch (error) {
                    // ps/tasklist команда не сработала, процесс точно не существует
                }
            }

            // Дополнительная проверка через поиск процесса с нужным файлом бота
            // ВАЖНО: НЕ восстанавливаем отслеживание, только проверяем существование
            if (!activeProcessInfo && actualStatus === 'stopped') {
                try {
                    const { execSync } = require('child_process');
                    // Ищем процесс который запускает файл этого бота
                    const botFileName = `bot_${projectId}.py`;
                    const psCommand = process.platform === 'win32'
                        ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV`
                        : `ps aux | grep python | grep -v grep`;
                    const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();

                    // Проверяем есть ли процесс с файлом этого бота
                    if (allPythonProcesses.includes(botFileName)) {
                        // Извлекаем PID из вывода ps для информации
                        const lines = allPythonProcesses.split('\n');
                        for (const line of lines) {
                            if (line.includes(botFileName)) {
                                const parts = line.trim().split(/\s+/);
                                const realPid = parseInt(parts[1]);

                                // Обновляем PID в базе данных для возможности остановки
                                await storage.updateBotInstance(instance.id, { processId: realPid.toString() });

                                // НЕ восстанавливаем отслеживание! Просто отмечаем как running
                                // чтобы пользователь мог нажать "Остановить" и убить процесс
                                actualStatus = 'running';
                                break;
                            }
                        }
                    }
                } catch (error) {
                    // Команда не сработала, процесс не найден
                }
            }

            // Если статус в базе не соответствует реальному состоянию - исправляем
            if (instance.status !== actualStatus) {
                await storage.updateBotInstance(instance.id, {
                    status: actualStatus,
                    errorMessage: actualStatus === 'stopped' ? 'Процесс завершен' : null
                });
                const updatedInstance = { ...instance, status: actualStatus };
                return res.json({ status: actualStatus, instance: updatedInstance });
            }

            return res.json({ status: instance.status, instance });
        } catch (error: any) {
            // Обрабатываем ошибку потери соединения с БД
            if (error.message && error.message.includes('Connection terminated unexpectedly')) {
                console.log(`⚠️ Соединение с БД прервано при получении статуса бота. Возвращаем stopped статус.`);
                return res.json({ status: 'stopped', instance: null });
            }
            
            console.error('Ошибка получения статуса бота:', error);
            return res.status(500).json({ message: "Failed to get bot status" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:id/bot/start
     *
     * Запускает бота для указанного проекта
     *
     * @route POST /api/projects/:id/bot/start
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} req.body - Тело запроса
     * @param {string} req.body.token - Токен бота (опционально)
     * @param {number} req.body.tokenId - Идентификатор токена (опционально)
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Запускает бота с указанным токеном. Если токен не передан, используется токен
     * по умолчанию для проекта. Проверяет, не запущен ли уже бот с этим токеном.
     * Возвращает информацию о запуске бота или ошибку.
     */
    app.post("/api/projects/:id/bot/start", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { token, tokenId } = req.body;

            // Проверяем проект
            const project = await storage.getBotProject(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            let botToken = token;
            let actualTokenId = tokenId;

            // Если не передан токен напрямую, используем токен по ID или по умолчанию
            if (!botToken) {
                if (tokenId) {
                    const selectedToken = await storage.getBotToken(tokenId);
                    if (selectedToken && selectedToken.projectId === projectId) {
                        botToken = selectedToken.token;
                        actualTokenId = selectedToken.id;
                    }
                } else {
                    // Используем токен по умолчанию
                    const defaultToken = await storage.getDefaultBotToken(projectId);
                    if (defaultToken) {
                        botToken = defaultToken.token;
                        actualTokenId = defaultToken.id;
                    }
                }
            }

            if (!botToken || !actualTokenId) {
                return res.status(400).json({ message: "Bot token is required" });
            }

            // Проверяем, не запущен ли уже этот конкретный бот (токен)
            const existingInstance = await storage.getBotInstanceByToken(actualTokenId);
            if (existingInstance && existingInstance.status === 'running') {
                return res.status(400).json({ message: "Bot is already running" });
            }

            const result = await startBot(projectId, botToken, actualTokenId);
            if (result.success) {
                // Отмечаем токен как использованный
                await storage.markTokenAsUsed(actualTokenId);

                return res.json({
                    message: "Bot started successfully",
                    processId: result.processId,
                    tokenUsed: true
                });
            } else {
                return res.status(500).json({ message: result.error || "Failed to start bot" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Failed to start bot" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:id/bot/stop
     *
     * Останавливает бота для указанного проекта
     *
     * @route POST /api/projects/:id/bot/stop
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} req.body - Тело запроса
     * @param {number} req.body.tokenId - Идентификатор токена бота
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Останавливает бота с указанным идентификатором токена. Проверяет,
     * что идентификатор токена передан. Возвращает результат остановки
     * или ошибку.
     */
    app.post("/api/projects/:id/bot/stop", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { tokenId } = req.body;

            if (!tokenId) {
                return res.status(400).json({ message: "Token ID is required" });
            }

            const result = await stopBot(projectId, tokenId);
            if (result.success) {
                return res.json({ message: "Bot stopped successfully" });
            } else {
                return res.status(500).json({ message: result.error || "Failed to stop bot" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Failed to stop bot" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:id/bot/restart
     *
     * Перезапускает бота для указанного проекта
     *
     * @route POST /api/projects/:id/bot/restart
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Останавливает и затем запускает бота заново. Получает текущий экземпляр бота,
     * останавливает его, ждет завершения процесса, затем запускает заново с токеном
     * по умолчанию. Возвращает результат перезапуска или ошибку.
     */
    app.post("/api/projects/:id/bot/restart", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);

            // Получаем текущий инстанс для получения tokenId
            const instance = await storage.getBotInstance(projectId);
            if (!instance) {
                return res.status(404).json({ message: "Bot instance not found" });
            }

            // Сначала останавливаем бота
            const stopResult = await stopBot(projectId, instance.tokenId);
            if (!stopResult.success) {
                return res.status(500).json({ message: stopResult.error || "Failed to stop bot" });
            }

            // Ждем немного, чтобы процесс полностью остановился
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Получаем токен для запуска
            const project = await storage.getBotProject(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            let botToken = null;

            // Используем токен по умолчанию
            const defaultToken = await storage.getDefaultBotToken(projectId);
            let botTokenId = null;
            if (defaultToken) {
                botToken = defaultToken.token;
                botTokenId = defaultToken.id;
            } else {
                return res.status(400).json({ message: "Default bot token not found" });
            }

            if (!botToken || !botTokenId) {
                return res.status(400).json({ message: "Bot token is required" });
            }

            // Запускаем бота заново
            const startResult = await startBot(projectId, botToken, botTokenId);
            if (startResult.success) {
                return res.json({
                    message: "Bot restarted successfully",
                    processId: startResult.processId
                });
            } else {
                return res.status(500).json({ message: startResult.error || "Failed to start bot after restart" });
            }
        } catch (error) {
            console.error('Ошибка перезапуска бота:', error);
            return res.status(500).json({ message: "Failed to restart bot" });
        }
    });
}
