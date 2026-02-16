import { WebSocketServer } from 'ws';
import { globalWssContainer } from './terminal-websocket';

/**
 * Возвращает глобальный экземпляр WebSocket-сервера терминала
 * @returns {WebSocketServer | null} - Экземпляр WebSocket-сервера или null
 */

export function getTerminalWss(): WebSocketServer | null {
    return globalWssContainer.wss;
}
