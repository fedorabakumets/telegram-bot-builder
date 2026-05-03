/**
 * @fileoverview Подписчик Redis Pub/Sub для событий платформы.
 * Слушает каналы bot:started, bot:stopped, bot:error, bot:message и пробрасывает
 * события в broadcastProjectEvent для рассылки WebSocket-клиентам.
 * @module server/redis/redisPlatformSubscriber
 */

import { getRedisSubscriber } from './redisClient';
import { broadcastProjectEvent } from '../terminal/broadcastProjectEvent';
import { waitForRedis } from './waitForRedis';
import type { ProjectEvent } from '../terminal/ProjectEvent';

/**
 * Паттерн подписки — охватывает все события ботов всех проектов
 */
const SUBSCRIBE_PATTERN = 'bot:*';

/**
 * Карта префиксов каналов на типы событий ProjectEvent
 */
const CHANNEL_TYPE_MAP: Record<string, ProjectEvent['type']> = {
  'bot:started': 'bot-started',
  'bot:stopped': 'bot-stopped',
  'bot:error': 'bot-error',
  'bot:message': 'new-message',
};

/**
 * Проверяет, относится ли канал к Redis-логам бота.
 * @param channel - Имя Redis-канала
 * @returns `true`, если канал начинается с `bot:logs:`
 */
function isLogsChannel(channel: string): boolean {
  return channel.startsWith('bot:logs:');
}

/**
 * Проверяет, относится ли канал к сообщениям диалога.
 * @param channel - Имя Redis-канала
 * @returns `true`, если канал начинается с `bot:message:`
 */
function isMessageChannel(channel: string): boolean {
  return channel.startsWith('bot:message:');
}

/**
 * Разбирает имя канала Redis и извлекает тип события, projectId и tokenId.
 * Формат канала: `bot:{action}:{projectId}:{tokenId}`
 * @param channel - Имя канала Redis
 * @returns Объект с типом события, projectId и tokenId или null при ошибке разбора
 */
function parseChannel(channel: string): {
  type: ProjectEvent['type'];
  projectId: number;
  tokenId: number;
} | null {
  // Формат: bot:started:123:456 или bot:message:123:456
  const parts = channel.split(':');
  if (parts.length < 4) return null;

  const prefix = `${parts[0]}:${parts[1]}`;
  const type = CHANNEL_TYPE_MAP[prefix];
  if (!type) return null;

  const projectId = parseInt(parts[2], 10);
  const tokenId = parseInt(parts[3], 10);
  if (isNaN(projectId) || isNaN(tokenId)) return null;

  return { type, projectId, tokenId };
}

/**
 * Обрабатывает входящее сообщение из Redis-канала.
 * Парсит канал, формирует ProjectEvent и вызывает broadcastProjectEvent.
 * @param pattern - Паттерн подписки (не используется)
 * @param channel - Имя канала, из которого пришло сообщение
 * @param message - Тело сообщения в формате JSON
 */
function handleMessage(_pattern: string, channel: string, message: string): void {
  const parsed = parseChannel(channel);
  if (!parsed) {
    if (isLogsChannel(channel)) {
      return;
    }
    console.warn(`[RedisSub] Неизвестный формат канала: ${channel}`);
    return;
  }

  let data: unknown;
  try {
    data = JSON.parse(message);
  } catch {
    data = { raw: message };
  }

  const event: ProjectEvent = {
    type: parsed.type,
    projectId: parsed.projectId,
    tokenId: parsed.tokenId,
    data,
    timestamp: new Date().toISOString(),
  };

  broadcastProjectEvent(parsed.projectId, event).catch((err) =>
    console.error(`[RedisSub] Ошибка broadcastProjectEvent:`, err)
  );
}

/**
 * Инициализирует подписку на Redis-каналы событий платформы.
 * Если Redis ещё не готов — повторяет попытку через 3 секунды, максимум 10 раз.
 */
export function initRedisPlatformSubscriber(): void {
  waitForRedis('[RedisSub]', () => {
    getRedisSubscriber()!.psubscribe(SUBSCRIBE_PATTERN).catch((err) =>
      console.error('[RedisSub] Ошибка psubscribe:', err)
    );

    getRedisSubscriber()!.on('pmessage', (...args: unknown[]) => {
      const [pattern, channel, message] = args as [string, string, string];
      handleMessage(pattern, channel, message);
    });

    console.log(`[RedisSub] Подписка на паттерн "${SUBSCRIBE_PATTERN}" активна`);
  }, () => {
    console.log('[RedisSub] Redis недоступен — подписка отключена, используется прямой вызов');
  });
}
