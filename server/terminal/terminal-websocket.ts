/**
 * @fileoverview Модуль для организации WebSocket-соединения для передачи вывода ботов в терминал
 *
 * Этот модуль реализует WebSocket-сервер, который позволяет передавать
 * вывод запущенных ботов в реальном времени в клиентский терминал.
 *
 * @module TerminalWebSocket
 */

import { WebSocketServer } from 'ws';

// Глобальный объект для хранения WebSocket-сервера
export const globalWssContainer = {
  wss: null as WebSocketServer | null
};

