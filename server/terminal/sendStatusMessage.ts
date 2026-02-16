import { WebSocket } from 'ws';
import { sendMessage } from './sendMessage';

/**
 * Отправляет статусное сообщение в WebSocket-соединение
 *
 * @param {WebSocket} ws - WebSocket-соединение
 * @param {string} content - Содержимое статусного сообщения
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 */
export function sendStatusMessage(ws: WebSocket, content: string, projectId: number, tokenId: number) {
    sendMessage(ws, 'status', content, projectId, tokenId);
}
