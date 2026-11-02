/** @fileoverview Прямая доставка терминального сообщения с повторной проверкой прав. */
import { WebSocket } from 'ws';
import { sendAuthorizedTerminal } from './terminal-access';
import { redactSecrets } from '../utils/redactSecrets';
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
        content: redactSecrets(content),
        projectId,
        tokenId,
        timestamp: new Date().toISOString()
    };

    void sendAuthorizedTerminal(ws, JSON.stringify(message), projectId, tokenId);
}
