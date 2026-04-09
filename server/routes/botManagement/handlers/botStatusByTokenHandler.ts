/**
 * @fileoverview Хендлер получения статуса бота по токену
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение статуса бота для указанного токена.
 *
 * @module botManagement/handlers/botStatusByTokenHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { checkProcessExists, isPythonProcess, findBotProcessPid } from '../utils/processChecker';
import { restoreProcessTracking } from '../utils/processRestorer';
import { findActiveProcessForToken } from '../../../utils/findActiveProcessForToken';

/**
 * Обрабатывает запрос на получение статуса бота по токену
 *
 * @function handleBotStatusByToken
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Проверяет статус бота для указанного токена в БД и системе,
 * при необходимости корректирует статус и восстанавливает отслеживание.
 */
export async function handleBotStatusByToken(req: Request, res: Response): Promise<void> {
    try {
        const tokenId = parseInt(req.params.tokenId);

        // Отключаем кэширование — статус должен всегда быть актуальным
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const instance = await storage.getBotInstanceByToken(tokenId);

        if (!instance) {
            res.json({ status: 'stopped', instance: null });
            return;
        }

        const projectId = instance.projectId;
        const activeProcessInfo = findActiveProcessForToken(projectId, tokenId);

        let actualStatus = activeProcessInfo ? 'running' : 'stopped';

        // Если процесс не найден в активных, но есть в БД, проверяем его существование
        if (!activeProcessInfo && instance.processId && checkProcessExists(instance.processId)) {
            console.log(`Процесс ${instance.processId} для токена ${tokenId} найден в системе`);
            restoreProcessTracking(projectId, instance.tokenId, parseInt(instance.processId));
            actualStatus = 'running';
        }

        // Дополнительная проверка для Python процессов
        if (!activeProcessInfo && instance.processId && actualStatus === 'stopped' && isPythonProcess(instance.processId)) {
            restoreProcessTracking(projectId, instance.tokenId, parseInt(instance.processId));
            actualStatus = 'running';
        }

        // Поиск PID если не найден
        if (!activeProcessInfo && actualStatus === 'stopped') {
            const realPid = findBotProcessPid(projectId);
            if (realPid) {
                await storage.updateBotInstance(instance.id, { processId: realPid.toString() });
                actualStatus = 'running';
            }
        }

        // Обновляем статус в БД если он изменился
        if (instance.status !== actualStatus) {
            await storage.updateBotInstance(instance.id, {
                status: actualStatus,
                errorMessage: actualStatus === 'stopped' ? 'Процесс завершен' : null
            });
            const updatedInstance = { ...instance, status: actualStatus };
            res.json({ status: actualStatus, instance: updatedInstance });
            return;
        }

        res.json({ status: instance.status, instance });
    } catch (error: any) {
        console.error('[BotStatus] Полная ошибка:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        if (error.message?.includes('Connection terminated unexpectedly')) {
            console.log('⚠️ Соединение с БД прервано при получении статуса бота');
            res.json({ status: 'stopped', instance: null });
            return;
        }

        console.error('Ошибка получения статуса бота по токену:', error);
        res.status(500).json({ message: "Не удалось получить статус бота" });
    }
}
