/**
 * @fileoverview Модуль для организации WebSocket-соединения для передачи вывода ботов в терминал
 *
 * Этот модуль реализует WebSocket-сервер, который позволяет передавать
 * вывод запущенных ботов в реальном времени в клиентский терминал.
 *
 * @module TerminalWebSocket
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { botProcesses } from './routes';

/**
 * Тип для сообщений, передаваемых через WebSocket
 * @typedef {Object} TerminalMessage
 * @property {string} type - Тип сообщения ('stdout' | 'stderr' | 'status')
 * @property {string} content - Содержимое сообщения
 * @property {number} projectId - Идентификатор проекта
 * @property {number} tokenId - Идентификатор токена
 * @property {string} timestamp - Временная метка
 */
interface TerminalMessage {
  type: 'stdout' | 'stderr' | 'status';
  content: string;
  projectId: number;
  tokenId: number;
  timestamp: string;
}

/**
 * Карта активных WebSocket-соединений для каждого проекта/токена
 * @type {Map<string, Set<WebSocket>>}
 */
const activeConnections = new Map<string, Set<WebSocket>>();

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

/**
 * Отправляет сообщение в WebSocket-соединение
 *
 * @param {WebSocket} ws - WebSocket-соединение
 * @param {'stdout' | 'stderr' | 'status'} type - Тип сообщения
 * @param {string} content - Содержимое сообщения
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 */
function sendMessage(ws: WebSocket, type: 'stdout' | 'stderr' | 'status', content: string, projectId: number, tokenId: number) {
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

/**
 * Отправляет статусное сообщение в WebSocket-соединение
 *
 * @param {WebSocket} ws - WebSocket-соединение
 * @param {string} content - Содержимое статусного сообщения
 * @param {number} projectId - Идентификатор проекта
 * @param {number} tokenId - Идентификатор токена
 */
function sendStatusMessage(ws: WebSocket, content: string, projectId: number, tokenId: number) {
  sendMessage(ws, 'status', content, projectId, tokenId);
}

/**
 * Настройка прослушивания вывода процессов ботов
 */
function setupBotProcessListeners() {
  // При добавлении нового процесса в botProcesses, подписываемся на его вывод
  // Обертываем методы Map для отслеживания изменений
  const originalSet = botProcesses.set.bind(botProcesses);

  botProcesses.set = function(key: string, value: any) {
    // Подписываемся на вывод процесса
    setupProcessOutputListener(key, value);

    return originalSet(key, value);
  };

  // Также проверяем уже существующие процессы
  for (const [key, process] of botProcesses) {
    setupProcessOutputListener(key, process);
  }
}

/**
 * Настройка прослушивания вывода для конкретного процесса
 *
 * @param {string} processKey - Ключ процесса в формате `${projectId}_${tokenId}`
 * @param {any} botProcess - Процесс бота
 */
function setupProcessOutputListener(processKey: string, botProcess: any) {
  const [projectIdStr, tokenIdStr] = processKey.split('_');
  const projectId = parseInt(projectIdStr);
  const tokenId = parseInt(tokenIdStr);

  if (isNaN(projectId) || isNaN(tokenId)) {
    console.error(`Некорректный ключ процесса: ${processKey}`);
    return;
  }

  console.log(`setupProcessOutputListener вызван для ${processKey}, уже подписан: ${!!botProcess.__terminal_subscribed}`);

  // Проверяем, есть ли уже подписка на этот процесс
  if (botProcess.__terminal_subscribed) {
    console.log(`Процесс ${processKey} уже подписан, выходим`);
    return; // Уже подписаны, выходим
  }

  // Помечаем процесс как подписанный
  botProcess.__terminal_subscribed = true;
  console.log(`Установлена подписка на процесс ${processKey}`);

  // Подписываемся на stdout
  botProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`Получены данные в stdout для ${processKey}: ${data.toString().substring(0, 50)}...`);
    const content = data.toString();
    sendOutputToTerminals(content, 'stdout', projectId, tokenId);
  });

  // Подписываемся на stderr
  botProcess.stderr?.on('data', (data: Buffer) => {
    console.log(`Получены данные в stderr для ${processKey}: ${data.toString().substring(0, 50)}...`);
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

  if (connections) {
    console.log(`Отправка сообщения '${content.substring(0, 50)}...' (${type}) для ${connectionKey}, количество соединений: ${connections.size}`);

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

// Глобальная переменная для хранения WebSocket-сервера
let globalWss: WebSocketServer | null = null;

/**
 * Возвращает глобальный экземпляр WebSocket-сервера терминала
 * @returns {WebSocketServer | null} - Экземпляр WebSocket-сервера или null
 */
export function getTerminalWss(): WebSocketServer | null {
  return globalWss;
}

/**
 * Устанавливает глобальный экземпляр WebSocket-сервера терминала
 * @param {WebSocketServer} wss - Экземпляр WebSocket-сервера
 */
export function setTerminalWss(wss: WebSocketServer): void {
  globalWss = wss;
}