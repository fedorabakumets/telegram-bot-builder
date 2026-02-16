import { WebSocket } from 'ws';
import { TerminalMessage } from './TerminalMessage';

/**
 * Отправляет сообщение в WebSocket-соединение
 *
 * @param {WebSocket} ws - WebSocket-соединение
 * @param {'stdout' | 'stderr' | 'status'} type - Тип сообщения
 * @param {string} content - Содержимое сообщения
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 */

export function sendMessage(ws: WebSocket, type: 'stdout' | 'stderr' | 'status', content: string, projectId: number, tokenId: number) {
    const message: TerminalMessage = {
        type,
        content,
        projectId,
        tokenId,
        timestamp: new Date().toISOString()
    };

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
