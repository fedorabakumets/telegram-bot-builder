/**
 * @fileoverview Настройка прослушивания вывода процессов ботов
 *
 * Этот модуль предоставляет функцию для настройки прослушивания
 * вывода процессов ботов и отправки его в терминал.
 * Хранит cleanup-функции для корректного удаления слушателей при остановке ботов.
 *
 * @module terminal/setupBotProcessListeners
 */

import { botProcesses } from '../routes/routes';
import { setupProcessOutputListener } from './setupProcessOutputListener';
import { workerManager } from '../bots/botWorkerManager';
import { sendOutputToTerminals } from './sendOutputToTerminals';

/**
 * Хранилище функций очистки слушателей для каждого процесса.
 * Ключ — processKey в формате `${projectId}_${tokenId}`.
 */
export const processCleanups = new Map<string, () => void>();

/**
 * Хранилище launchId для каждого процесса.
 * Заполняется из startBot до вызова botProcesses.set.
 * Ключ — processKey в формате `${projectId}_${tokenId}`.
 */
export const pendingLaunchIds = new Map<string, number>();

/**
 * Настройка прослушивания вывода процессов ботов
 *
 * @description
 * Обертывает метод Map.set для автоматической подписки на вывод новых процессов.
 * Сохраняет возвращаемые cleanup-функции в {@link processCleanups}.
 */
export function setupBotProcessListeners() {
    const originalSet = botProcesses.set.bind(botProcesses);

    botProcesses.set = function (key: string, value: any) {
        console.log(`[Terminal] Добавление процесса: ${key}`);
        const result = originalSet(key, value);

        const launchId = pendingLaunchIds.get(key);
        pendingLaunchIds.delete(key);

        // Проверяем, является ли объект реальным ChildProcess перед подпиской
        if (value.stdout || value.stderr) {
            const cleanup = setupProcessOutputListener(key, value, launchId);
            processCleanups.set(key, cleanup);
        } else {
            console.log(`[Terminal] Пропуск mock-процесса при set: ${key}`);
        }

        return result;
    };

    console.log(`[Terminal] Проверка существующих процессов: ${botProcesses.size}`);
    for (const [key, process] of botProcesses) {
        // Проверяем, является ли объект реальным ChildProcess
        // Mock-процессы из createMockProcess не имеют stdout/stderr
        if (!process.stdout && !process.stderr) {
            console.log(`[Terminal] Пропуск mock-процесса: ${key}`);
            continue;
        }
        console.log(`[Terminal] Подписка на существующий процесс: ${key}`);
        const cleanup = setupProcessOutputListener(key, process);
        processCleanups.set(key, cleanup);
    }

    console.log('[Terminal] Прослушивание процессов ботов настроено');

    // ─── Режим воркера: подписка на логи из worker pool ───
    if (process.env.USE_WORKER_POOL === 'true') {
      workerManager.on('bot-log', (projectId: number, tokenId: number, type: string, content: string) => {
        // Маршрутизируем логи воркера через тот же механизм что и для обычных процессов
        const streamType = (type === 'stderr') ? 'stderr' : 'stdout';
        sendOutputToTerminals(content, streamType, projectId, tokenId);
      });

      console.log('[Terminal] Подписка на логи воркеров настроена');
    }
}
