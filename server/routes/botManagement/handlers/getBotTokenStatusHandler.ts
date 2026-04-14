/**
 * @fileoverview Хендлер получения статуса бота по tokenId с поддержкой формата `token_131`
 * @module botManagement/handlers/getBotTokenStatusHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { checkProcessExists, isPythonProcess, findBotProcessPid } from '../utils/processChecker';
import { restoreProcessTracking } from '../utils/processRestorer';
import { findActiveProcessForToken } from '../../../utils/findActiveProcessForToken';

/**
 * Нормализует tokenId — срезает префикс `token_` если он есть
 * @param raw - Сырое значение из параметра маршрута
 * @returns Числовой идентификатор токена
 */
function parseTokenId(raw: string): number {
    const cleaned = raw.startsWith('token_') ? raw.slice(6) : raw;
    return parseInt(cleaned, 10);
}

/**
 * Обрабатывает GET /api/bot/tokens/:tokenId/status
 *
 * Принимает tokenId в формате `131` или `token_131`.
 * Возвращает статус бота и данные экземпляра с именем бота.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns Promise<void>
 */
export async function getBotTokenStatusHandler(req: Request, res: Response): Promise<void> {
    try {
        const tokenId = parseTokenId(req.params.tokenId);
        const telegramId = req.query.telegram_id;

        if (telegramId) {
            console.log(`[BotTokenStatus] Запрос от telegram_id=${telegramId} для токена ${tokenId}`);
        }

        // Отключаем кэширование — статус должен быть актуальным
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        if (isNaN(tokenId)) {
            res.status(400).json({ status: 'stopped', instance: { botName: 'Неизвестный бот', tokenId: 0, status: 'stopped' } });
            return;
        }

        // Получаем имя бота из таблицы bot_tokens
        const tokenRecord = await storage.getBotToken(tokenId);
        const botName = tokenRecord?.name ?? 'Неизвестный бот';

        const instance = await storage.getBotInstanceByToken(tokenId);

        if (!instance) {
            res.json({
                status: 'stopped',
                instance: { botName, tokenId, status: 'stopped' },
            });
            return;
        }

        const projectId = instance.projectId;
        const activeProcessInfo = findActiveProcessForToken(projectId, tokenId);
        let actualStatus = activeProcessInfo ? 'running' : 'stopped';

        // Проверяем существование процесса в системе
        if (!activeProcessInfo && instance.processId && checkProcessExists(instance.processId)) {
            restoreProcessTracking(projectId, instance.tokenId, parseInt(instance.processId));
            actualStatus = 'running';
        }

        // Дополнительная проверка для Python-процессов
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

        // Обновляем статус в БД если изменился
        if (instance.status !== actualStatus) {
            await storage.updateBotInstance(instance.id, {
                status: actualStatus,
                errorMessage: actualStatus === 'stopped' ? 'Процесс завершен' : null,
            });
        }

        res.json({
            status: actualStatus,
            instance: {
                botName,
                tokenId,
                status: actualStatus,
                startedAt: instance.startedAt,
                processId: instance.processId,
            },
        });
    } catch (error: any) {
        console.error('[BotTokenStatus] Ошибка:', error.message);
        res.status(500).json({ message: 'Не удалось получить статус бота' });
    }
}
