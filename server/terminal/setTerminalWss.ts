import { WebSocketServer } from 'ws';
import { globalWssContainer } from './terminal-websocket';

/**
 * Устанавливает глобальный экземпляр WebSocket-сервера терминала
 * @param {WebSocketServer} wss - Экземпляр WebSocket-сервера
 */

export function setTerminalWss(wss: WebSocketServer): void {
    globalWssContainer.wss = wss;
}
