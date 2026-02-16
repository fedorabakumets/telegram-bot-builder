import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import { TerminalMessage } from './TerminalMessage';

/**
 * Отправка вывода в активные терминалы для указанного проекта/токена
 *
 * @param {string} content - Содержимое вывода
 * @param {'stdout' | 'stderr' | 'status'} type - Тип вывода
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 */

export function sendOutputToTerminals(content: string, type: 'stdout' | 'stderr' | 'status', projectId: number, tokenId: number) {
    const connectionKey = `${projectId}_${tokenId}`;
    const connections = activeConnections.get(connectionKey);

    // Выводим лог в консоль сервера
    console.log(`[PID:${projectId}/${tokenId}] ${content.trim()}`);

    if (connections) {
        const message: TerminalMessage = {
            type,
            content,
            projectId,
            tokenId,
            timestamp: new Date().toISOString()
        };

        // Отправляем сообщение всем активным соединениям для этого проекта/токена
        for (const ws of connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }

}
