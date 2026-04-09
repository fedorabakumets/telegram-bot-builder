/**
 * @fileoverview Настройка прослушивания вывода для конкретного процесса
 *
 * Этот модуль предоставляет функцию для настройки прослушивания
 * stdout/stderr процесса бота и отправки вывода в терминал.
 * Возвращает функцию cleanup для удаления слушателей и предотвращения утечек памяти.
 *
 * @module terminal/setupProcessOutputListener
 */

import { sendOutputToTerminals } from './sendOutputToTerminals';
import { flushBuffer } from './botLogsBuffer';

/**
 * Настройка прослушивания вывода для конкретного процесса
 *
 * @param {string} processKey - Ключ процесса в формате `${projectId}_${tokenId}`
 * @param {any} botProcess - Процесс бота
 * @returns {() => void} Функция очистки — удаляет все навешенные слушатели
 */
export function setupProcessOutputListener(processKey: string, botProcess: any): () => void {
    const [projectIdStr, tokenIdStr] = processKey.split('_');
    const projectId = parseInt(projectIdStr);
    const tokenId = parseInt(tokenIdStr);

    if (isNaN(projectId) || isNaN(tokenId)) {
        console.error(`Некорректный ключ процесса: ${processKey}`);
        return () => {};
    }

    // Проверяем, есть ли уже подписка на этот процесс
    if (botProcess.__terminal_subscribed) {
        console.log(`[Terminal] Процесс ${processKey} уже подписан`);
        return () => {};
    }

    // Помечаем процесс как подписанный
    botProcess.__terminal_subscribed = true;
    console.log(`[Terminal] Подписка на процесс ${processKey} (PID: ${botProcess.pid})`);

    /** Именованный обработчик stdout для возможности последующего удаления */
    const onStdout = (data: Buffer) => {
        const content = data.toString();
        console.log(`[Terminal:${processKey}] stdout: ${content.trim().substring(0, 100)}`);
        sendOutputToTerminals(content, 'stdout', projectId, tokenId);
    };

    /** Именованный обработчик stderr для возможности последующего удаления */
    const onStderr = (data: Buffer) => {
        const content = data.toString();
        console.log(`[Terminal:${processKey}] stderr: ${content.trim().substring(0, 100)}`);
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    };

    /** Именованный обработчик завершения процесса для возможности последующего удаления */
    const onExit = async (code: number, signal: string) => {
        const content = `Процесс завершен с кодом ${code}, сигнал: ${signal}`;
        console.log(`[Terminal:${processKey}] exit: ${content}`);
        sendOutputToTerminals(content, 'status', projectId, tokenId);
        await flushBuffer(processKey);
    };

    /** Именованный обработчик ошибок процесса для возможности последующего удаления */
    const onError = (error: Error) => {
        const content = `Ошибка процесса: ${error.message}`;
        console.error(`[Terminal:${processKey}] error: ${content}`);
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    };

    botProcess.stdout?.on('data', onStdout);
    botProcess.stderr?.on('data', onStderr);
    botProcess.on('exit', onExit);
    botProcess.on('error', onError);

    /**
     * Удаляет все слушатели процесса, предотвращая утечку памяти
     * @returns {void}
     */
    return () => {
        botProcess.stdout?.off('data', onStdout);
        botProcess.stderr?.off('data', onStderr);
        botProcess.off('exit', onExit);
        botProcess.off('error', onError);
        botProcess.__terminal_subscribed = false;
        console.log(`[Terminal] Слушатели процесса ${processKey} удалены`);
    };
}
