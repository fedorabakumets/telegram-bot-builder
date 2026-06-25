/**
 * @fileoverview Хендлер перезапуска бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на перезапуск бота для указанного проекта.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module botManagement/handlers/botRestartHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { stopBot } from '../../../bots/stopBot';
import { storage } from '../../../storages/storage';

/**
 * Нормализует tokenId из тела запроса.
 * Принимает число, числовую строку или строку вида "token_42" — возвращает число.
 * @param raw - Сырое значение tokenId из body
 * @returns Числовой ID или undefined если не удалось распарсить
 */
function parseTokenId(raw: unknown): number | undefined {
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string') {
        const match = raw.match(/(\d+)$/);
        if (match) {
            const n = parseInt(match[1], 10);
            return isNaN(n) ? undefined : n;
        }
    }
    return undefined;
}

/** Целевой токен для перезапуска: id для остановки/старта и строка токена */
interface RestartTarget {
    /** ID токена (для stopBot/startBot) */
    tokenId: number;
    /** Строка токена бота (для startBot) */
    token: string;
}

/**
 * Определяет целевой токен для перезапуска.
 * Если tokenId передан — резолвит конкретный токен с проверкой принадлежности проекту
 * (для мультитокенных проектов). Иначе — текущее поведение: текущий инстанс проекта +
 * дефолтный токен. Возвращает цель либо HTTP-ошибку (status + message).
 * @param projectId - ID проекта
 * @param tokenId - Опциональный ID токена из тела запроса
 * @returns Цель перезапуска либо объект ошибки со status и message
 */
async function resolveRestartTarget(
    projectId: number,
    tokenId: number | undefined,
): Promise<RestartTarget | { status: number; message: string }> {
    // Конкретный токен (мультитокенный проект)
    if (tokenId != null) {
        const target = await storage.getBotToken(tokenId);
        if (!target) return { status: 404, message: "Токен не найден" };
        if (target.projectId !== projectId) {
            return { status: 403, message: "Токен не принадлежит проекту" };
        }
        if (!target.token) return { status: 400, message: "У токена нет значения" };
        return { tokenId: target.id, token: target.token };
    }

    // Текущее поведение: инстанс проекта + дефолтный токен
    const instance = await storage.getBotInstance(projectId);
    if (!instance) return { status: 404, message: "Экземпляр бота не найден" };
    const defaultToken = await storage.getDefaultBotToken(projectId);
    if (!defaultToken || !defaultToken.token || !defaultToken.id) {
        return { status: 400, message: "Токен бота по умолчанию не найден" };
    }
    // Останавливаем текущую инстанцию, запускаем дефолтный токен (как было исторически)
    return { tokenId: instance.tokenId, token: defaultToken.token };
}

/**
 * Обрабатывает запрос на перезапуск бота
 *
 * @function handleBotRestart
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Останавливает и затем запускает бота заново. Если в теле передан tokenId —
 * перезапускает именно этот токен (для проектов с несколькими токенами); иначе
 * использует текущий инстанс + токен по умолчанию (обратная совместимость).
 * Поддерживает tokenId как число, строку "42" или "token_42".
 */
export async function handleBotRestart(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const tokenId = parseTokenId(req.body?.tokenId);

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const target = await resolveRestartTarget(projectId, tokenId);
        if ('status' in target) {
            res.status(target.status).json({ message: target.message });
            return;
        }

        const stopResult = await stopBot(projectId, target.tokenId);
        if (!stopResult.success) {
            res.status(500).json({ message: stopResult.error || "Не удалось остановить бота" });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const startResult = await startBot(projectId, target.token, target.tokenId);
        if (startResult.success) {
            res.json({
                message: "Бот успешно перезапущен",
                processId: startResult.processId,
            });
        } else {
            res.status(500).json({ message: startResult.error || "Не удалось запустить бота после перезапуска" });
        }
    } catch (error) {
        console.error('Ошибка перезапуска бота:', error);
        res.status(500).json({ message: "Не удалось перезапустить бота" });
    }
}
