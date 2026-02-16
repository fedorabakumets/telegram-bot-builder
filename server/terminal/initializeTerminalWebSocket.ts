import { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { activeConnections } from './activeConnections';
import { sendStatusMessage } from './sendStatusMessage';
import { setTerminalWss } from './setTerminalWss';
import { setupBotProcessListeners } from './setupBotProcessListeners';

/**
 * Инициализирует WebSocket-сервер для передачи вывода ботов
 *
 * @param {HttpServer} server - HTTP-сервер, к которому будет подключен WebSocket
 * @returns {WebSocketServer} - Экземпляр WebSocket-сервера
 */

export function initializeTerminalWebSocket(server: HttpServer): WebSocketServer {
    const wss = new WebSocketServer({ server, path: '/api/terminal' });

    wss.on('connection', (ws: WebSocket, request) => {
        console.log('Новое WebSocket-соединение для терминала');

        // Обработка параметров запроса для определения проекта/токена
        const urlParams = new URLSearchParams(request.url?.split('?')[1]);
        const projectId = urlParams.get('projectId');
        const tokenId = urlParams.get('tokenId');

        if (!projectId || !tokenId) {
            console.error('Отсутствуют обязательные параметры projectId или tokenId');
            ws.close(4001, 'Отсутствуют обязательные параметры');
            return;
        }

        const connectionKey = `${projectId}_${tokenId}`;

        // Добавляем соединение в карту
        if (!activeConnections.has(connectionKey)) {
            activeConnections.set(connectionKey, new Set<WebSocket>());
        }
        activeConnections.get(connectionKey)!.add(ws);

        // Отправляем статус подключения
        sendStatusMessage(ws, 'connected', parseInt(projectId), parseInt(tokenId));

        // Обработка закрытия соединения
        ws.on('close', () => {
            console.log(`WebSocket-соединение закрыто для проекта ${projectId}, токена ${tokenId}`);
            const connections = activeConnections.get(connectionKey);
            if (connections) {
                connections.delete(ws);
                if (connections.size === 0) {
                    activeConnections.delete(connectionKey);
                }
            }
        });

        // Обработка ошибок соединения
        ws.on('error', (error) => {
            console.error(`Ошибка WebSocket-соединения для проекта ${projectId}, токена ${tokenId}:`, error);
            const connections = activeConnections.get(connectionKey);
            if (connections) {
                connections.delete(ws);
                if (connections.size === 0) {
                    activeConnections.delete(connectionKey);
                }
            }
        });

        // Обработка входящих сообщений (если нужно)
        ws.on('message', (data) => {
            // Можно обрабатывать команды от клиента, например, очистку терминала
            const message = data.toString();
            try {
                const parsedMessage = JSON.parse(message);
                if (parsedMessage.command === 'clear') {
                    // Команда очистки терминала
                    console.log(`Получена команда очистки терминала для проекта ${projectId}, токена ${tokenId}`);
                }
            } catch (e) {
                // Игнорируем некорректные сообщения
                console.warn('Получено некорректное сообщение от клиента:', message);
            }
        });
    });

    wss.on('error', (error) => {
        console.error('Ошибка WebSocket-сервера:', error);
    });

    // Подписываемся на вывод процессов ботов
    setupBotProcessListeners();

    // Устанавливаем сервер в глобальную переменную
    setTerminalWss(wss);

    console.log('WebSocket-сервер для терминала инициализирован на /api/terminal');
    return wss;
}
