/**
 * @fileoverview Настройка прослушивания вывода для конкретного процесса
 *
 * Этот модуль предоставляет функцию для настройки прослушивания
 * stdout/stderr процесса бота и отправки вывода в терминал.
 *
 * @module terminal/setupProcessOutputListener
 */

import { sendOutputToTerminals } from './sendOutputToTerminals';

/**
 * Настройка прослушивания вывода для конкретного процесса
 *
 * @param {string} processKey - Ключ процесса в формате `${projectId}_${tokenId}`
 * @param {any} botProcess - Процесс бота
 */
export function setupProcessOutputListener(processKey: string, botProcess: any) {
    const [projectIdStr, tokenIdStr] = processKey.split('_');
    const projectId = parseInt(projectIdStr);
    const tokenId = parseInt(tokenIdStr);

    if (isNaN(projectId) || isNaN(tokenId)) {
        console.error(`Некорректный ключ процесса: ${processKey}`);
        return;
    }

    // Проверяем, есть ли уже подписка на этот процесс
    if (botProcess.__terminal_subscribed) {
        console.log(`[Terminal] Процесс ${processKey} уже подписан`);
        return; // Уже подписаны, выходим
    }

    // Помечаем процесс как подписанный
    botProcess.__terminal_subscribed = true;
    console.log(`[Terminal] Подписка на процесс ${processKey} (PID: ${botProcess.pid})`);

    // Подписываемся на stdout
    botProcess.stdout?.on('data', (data: Buffer) => {
        const content = data.toString();
        console.log(`[Terminal:${processKey}] stdout: ${content.trim().substring(0, 100)}`);
        sendOutputToTerminals(content, 'stdout', projectId, tokenId);
    });

    // Подписываемся на stderr
    botProcess.stderr?.on('data', (data: Buffer) => {
        const content = data.toString();
        console.log(`[Terminal:${processKey}] stderr: ${content.trim().substring(0, 100)}`);
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    });

    // Подписываемся на завершение процесса
    botProcess.on('exit', (code: number, signal: string) => {
        const content = `Процесс завершен с кодом ${code}, сигнал: ${signal}`;
        console.log(`[Terminal:${processKey}] exit: ${content}`);
        sendOutputToTerminals(content, 'status', projectId, tokenId);
    });

    // Подписываемся на ошибки процесса
    botProcess.on('error', (error: Error) => {
        const content = `Ошибка процесса: ${error.message}`;
        console.error(`[Terminal:${processKey}] error: ${content}`);
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    });
}
