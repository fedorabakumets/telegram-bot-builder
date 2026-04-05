/**
 * @fileoverview Настройка прослушивания вывода процессов ботов
 *
 * Этот модуль предоставляет функцию для настройки прослушивания
 * вывода процессов ботов и отправки его в терминал.
 * Хранит cleanup-функции для корректного удаления слушателей при остановке ботов.
 *
 * @module terminal/setupBotProcessListeners
 */

import { botProcesses } from 'server/routes/routes';
import { setupProcessOutputListener } from './setupProcessOutputListener';

/**
 * Хранилище функций очистки слушателей для каждого процесса.
 * Ключ — processKey в формате `${projectId}_${tokenId}`.
 * Используется в stopBot и startBot для удаления слушателей перед удалением процесса.
 */
export const processCleanups = new Map<string, () => void>();

/**
 * Настройка прослушивания вывода процессов ботов
 *
 * @description
 * Обертывает метод Map.set для автоматической подписки на вывод новых процессов.
 * Сохраняет возвращаемые cleanup-функции в {@link processCleanups}.
 */
export function setupBotProcessListeners() {
    // Сохраняем оригинальный метод set
    const originalSet = botProcesses.set.bind(botProcesses);

    // Переопределяем метод set для автоматической подписки и сохранения cleanup
    botProcesses.set = function (key: string, value: any) {
        console.log(`[Terminal] Добавление процесса: ${key}`);

        const result = originalSet(key, value);

        // Подписываемся и сохраняем функцию очистки
        const cleanup = setupProcessOutputListener(key, value);
        processCleanups.set(key, cleanup);

        return result;
    };

    // Подписываемся на уже существующие процессы
    console.log(`[Terminal] Проверка существующих процессов: ${botProcesses.size}`);
    for (const [key, process] of botProcesses) {
        console.log(`[Terminal] Подписка на существующий процесс: ${key}`);
        const cleanup = setupProcessOutputListener(key, process);
        processCleanups.set(key, cleanup);
    }

    console.log('[Terminal] Прослушивание процессов ботов настроено');
}
