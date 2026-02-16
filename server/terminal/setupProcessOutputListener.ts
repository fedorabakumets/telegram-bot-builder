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
        return; // Уже подписаны, выходим
    }

    // Помечаем процесс как подписанный
    botProcess.__terminal_subscribed = true;

    // Подписываемся на stdout
    botProcess.stdout?.on('data', (data: Buffer) => {
        const content = data.toString();
        sendOutputToTerminals(content, 'stdout', projectId, tokenId);
    });

    // Подписываемся на stderr
    botProcess.stderr?.on('data', (data: Buffer) => {
        const content = data.toString();
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    });

    // Подписываемся на завершение процесса
    botProcess.on('exit', (code: number, signal: string) => {
        const content = `Процесс завершен с кодом ${code}, сигнал: ${signal}`;
        sendOutputToTerminals(content, 'status', projectId, tokenId);
    });

    // Подписываемся на ошибки процесса
    botProcess.on('error', (error: Error) => {
        const content = `Ошибка процесса: ${error.message}`;
        sendOutputToTerminals(content, 'stderr', projectId, tokenId);
    });
}
