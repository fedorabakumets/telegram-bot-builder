/**
 * @fileoverview Хендлер получения статуса бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение статуса бота для указанного проекта.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module botManagement/handlers/botStatusHandler
 */

import type { Request, Response } from 'express';
import { findActiveProcessForProject } from '../../../utils/findActiveProcessForProject';
import { storage } from '../../../storages/storage';
import { checkProcessExists, isPythonProcess, findBotProcessPid } from '../utils/processChecker';
import { restoreProcessTracking } from '../utils/processRestorer';

/**
 * Обрабатывает запрос на получение статуса бота
 *
 * @function handleBotStatus
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Проверяет статус бота в БД и системе, при необходимости
 * корректирует статус и восстанавливает отслеживание.
 */
export async function handleBotStatus(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        const instance = await storage.getBotInstance(projectId);
        
        if (!instance) {
            res.json({ status: 'stopped', instance: null });
            return;
        }

        const activeProcessInfo = findActiveProcessForProject(projectId);
        let actualStatus = activeProcessInfo ? 'running' : 'stopped';

        if (!activeProcessInfo && instance.processId && checkProcessExists(instance.processId)) {
            console.log(`Процесс ${instance.processId} для бота ${projectId} найден в системе`);
            if (instance.tokenId) {
                restoreProcessTracking(projectId, instance.tokenId, parseInt(instance.processId));
            }
            actualStatus = 'running';
        }

        if (!activeProcessInfo && instance.processId && actualStatus === 'stopped' && isPythonProcess(instance.processId)) {
            if (instance.tokenId) {
                restoreProcessTracking(projectId, instance.tokenId, parseInt(instance.processId));
            }
            actualStatus = 'running';
        }

        if (!activeProcessInfo && actualStatus === 'stopped') {
            const realPid = findBotProcessPid(projectId);
            if (realPid) {
                await storage.updateBotInstance(instance.id, { processId: realPid.toString() });
                actualStatus = 'running';
            }
        }

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
        if (error.message?.includes('Connection terminated unexpectedly')) {
            console.log('⚠️ Соединение с БД прервано при получении статуса бота');
            res.json({ status: 'stopped', instance: null });
            return;
        }

        console.error('Ошибка получения статуса бота:', error);
        res.status(500).json({ message: "Не удалось получить статус бота" });
    }
}
