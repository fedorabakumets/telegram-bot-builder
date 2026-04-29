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
 * Преобразует технический статус бота в понятную подпись для карточки.
 * @param status - Технический статус бота
 * @returns Человекочитаемая подпись статуса
 */
function formatStatusLabel(status: string): string {
    if (status === 'running') {
        return '🟢 Работает';
    }
    if (status === 'stopped') {
        return '🔴 Остановлен';
    }
    return '⚪ Неизвестно';
}

/**
 * Форматирует время работы бота в читаемый вид
 * @param startedAt - Дата/время запуска бота
 * @returns Строка вида "3д 14ч 22м" или "Только что" если меньше минуты
 */
function formatUptime(startedAt: Date | string | null | undefined): string {
    if (!startedAt) return '—';
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    if (diffMs < 0) return '—';
    const totalSeconds = Math.floor(diffMs / 1000);
    if (totalSeconds < 60) return `${totalSeconds}с`;
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / 86400);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0) parts.push(`${hours}ч`);
    if (minutes > 0) parts.push(`${minutes}м`);
    if (seconds > 0) parts.push(`${seconds}с`);
    return parts.length > 0 ? parts.join(' ') : 'Только что';
}

/**
 * Форматирует число с разделителями тысяч
 */
function formatNumber(num: number): string {
    return num.toLocaleString('ru-RU');
}

/**
 * Обрабатывает GET /api/bot/tokens/:tokenId/status
 *
 * Принимает tokenId в формате `131` или `token_131`.
 * Возвращает статус бота и данные экземпляра с именем и username бота.
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
            res.status(400).json({
                status: 'stopped',
                instance: {
                    botName: 'Неизвестный бот',
                    botUsername: null,
                    tokenId: 0,
                    status: 'stopped',
                    statusLabel: formatStatusLabel('stopped'),
                },
            });
            return;
        }

        // Получаем имя и username бота из таблицы bot_tokens
        const tokenRecord = await storage.getBotToken(tokenId);
        const botName = tokenRecord?.name ?? 'Неизвестный бот';
        const botUsername = tokenRecord?.botUsername ?? null;

        const instance = await storage.getBotInstanceByToken(tokenId);

        if (!instance) {
            res.json({
                status: 'stopped',
                instance: {
                    botName,
                    botUsername,
                    tokenId,
                    token: tokenRecord?.token ?? null,
                    status: 'stopped',
                    statusLabel: formatStatusLabel('stopped'),
                    uptime: null,
                },
            });
            return;
        }

        const projectId = instance.projectId;
        const activeProcessInfo = findActiveProcessForToken(projectId, tokenId);
        let actualStatus = activeProcessInfo ? 'running' : 'stopped';

        // Получаем статистику пользователей
        let userStats = {
            total: '0',
            active_24h: '0',
            active_7d: '0',
            new_today: '0',
        };
        try {
            const stats = await storage.getTokenUserStats(tokenId);
            userStats = {
                total: formatNumber(stats.total_users),
                active_24h: formatNumber(stats.active_24h),
                active_7d: formatNumber(stats.active_7d),
                new_today: formatNumber(stats.new_today),
            };
        } catch (err) {
            console.warn('[BotTokenStatus] Не удалось получить статистику:', err);
        }

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
            userStats,
            instance: {
                botName,
                botUsername,
                tokenId,
                token: tokenRecord?.token ?? null,
                status: actualStatus,
                statusLabel: formatStatusLabel(actualStatus),
                uptime: actualStatus === 'running' ? formatUptime(instance.startedAt) : null,
                startedAt: instance.startedAt,
                processId: instance.processId,
            },
        });
    } catch (error: any) {
        console.error('[BotTokenStatus] Ошибка:', error.message);
        res.status(500).json({ message: 'Не удалось получить статус бота' });
    }
}
