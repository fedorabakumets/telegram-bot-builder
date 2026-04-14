/**
 * @fileoverview Подписчик Redis Pub/Sub для логов ботов в реальном времени.
 * Слушает паттерн bot:logs:* и пробрасывает сообщения в активные WebSocket-терминалы.
 * Работает параллельно с stdout/pipe — дополнительный канал доставки логов.
 * @module server/redis/redisLogsSubscriber
 */

import { getRedisSubscriber } from './redisClient';
import { sendOutputToTerminals } from '../terminal/sendOutputToTerminals';
import { waitForRedis } from './waitForRedis';

/** Паттерн подписки на каналы логов всех ботов */
const LOGS_PATTERN = 'bot:logs:*';

/** Метка для логов сервера */
const LABEL = '[RedisLogs]';

/**
 * Структура сообщения лога из Redis-канала
 */
interface RedisLogMessage {
  /** Уровень лога: INFO, WARNING, ERROR, DEBUG */
  level: string;
  /** Текст сообщения */
  message: string;
  /** ISO-строка временной метки */
  timestamp: string;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
}

/**
 * Разбирает имя канала и извлекает projectId и tokenId.
 * Формат канала: `bot:logs:{projectId}:{tokenId}`
 * @param channel - Имя канала Redis
 * @returns Объект с projectId и tokenId или null при ошибке
 */
function parseLogsChannel(channel: string): { projectId: number; tokenId: number } | null {
  const parts = channel.split(':');
  if (parts.length < 4) return null;

  const projectId = parseInt(parts[2], 10);
  const tokenId = parseInt(parts[3], 10);
  if (isNaN(projectId) || isNaN(tokenId)) return null;

  return { projectId, tokenId };
}

/**
 * Обрабатывает входящее сообщение лога из Redis.
 * Парсит канал и тело, затем вызывает sendOutputToTerminals.
 * @param channel - Имя канала Redis
 * @param message - Тело сообщения в формате JSON
 */
function handleLogMessage(channel: string, message: string): void {
  const parsed = parseLogsChannel(channel);
  if (!parsed) return;

  let data: RedisLogMessage;
  try {
    data = JSON.parse(message) as RedisLogMessage;
  } catch {
    return;
  }

  // launchId не передаётся — Redis-логи не привязаны к конкретному запуску
  sendOutputToTerminals(
    data.message,
    'stdout',
    parsed.projectId,
    parsed.tokenId
  );
}

/**
 * Инициализирует подписку на Redis-каналы логов ботов.
 * Добавляет psubscribe('bot:logs:*') к существующему subscriber-соединению.
 * Если Redis недоступен — функция завершается без ошибок (fallback на stdout).
 */
export function initRedisLogsSubscriber(): void {
  waitForRedis(LABEL, () => {
    const subscriber = getRedisSubscriber()!;

    subscriber.psubscribe(LOGS_PATTERN).catch((err) =>
      console.error(`${LABEL} Ошибка psubscribe:`, err)
    );

    subscriber.on('pmessage', (...args: unknown[]) => {
      const [pattern, channel, message] = args as [string, string, string];
      // Обрабатываем только сообщения нашего паттерна
      if (pattern === LOGS_PATTERN) {
        handleLogMessage(channel, message);
      }
    });

    console.log(`${LABEL} Подписка на паттерн "${LOGS_PATTERN}" активна`);
  });
}
