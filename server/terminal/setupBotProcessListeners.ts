/**
 * @fileoverview Настройка прослушивания вывода процессов ботов
 *
 * Этот модуль предоставляет функцию для настройки прослушивания
 * вывода процессов ботов и отправки его в терминал.
 *
 * @module terminal/setupBotProcessListeners
 */

import { botProcesses } from 'server/routes/routes';
import { setupProcessOutputListener } from './setupProcessOutputListener';

/**
 * Настройка прослушивания вывода процессов ботов
 *
 * @function setupBotProcessListeners
 * @description
 * Обертывает метод Map.set для автоматической подписки на вывод новых процессов
 */
export function setupBotProcessListeners() {
    // Сохраняем оригинальный метод set
    const originalSet = botProcesses.set.bind(botProcesses);

    // Переопределяем метод set для автоматической подписки
    botProcesses.set = function (key: string, value: any) {
        console.log(`[Terminal] Добавление процесса: ${key}`);

        // Сначала вызываем оригинальный метод
        const result = originalSet(key, value);

        // Затем подписываемся на вывод процесса
        setupProcessOutputListener(key, value);

        return result;
    };

    // Также проверяем уже существующие процессы
    console.log(`[Terminal] Проверка существующих процессов: ${botProcesses.size}`);
    for (const [key, process] of botProcesses) {
        console.log(`[Terminal] Подписка на существующий процесс: ${key}`);
        setupProcessOutputListener(key, process);
    }

    console.log('[Terminal] Прослушивание процессов ботов настроено');
}
