/**
 * @fileoverview Redis-клиент для публикации и подписки на события платформы.
 * Использует два отдельных соединения: publisher и subscriber.
 * Если REDIS_URL не задан или ioredis недоступен — оба клиента null.
 * @module server/redis/redisClient
 */

/** Тип клиента ioredis (используется для типизации без прямого импорта) */
type RedisClient = {
  publish(channel: string, message: string): Promise<number>;
  subscribe(...channels: string[]): Promise<unknown>;
  psubscribe(...patterns: string[]): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  quit(): Promise<string>;
  del(...keys: string[]): Promise<number>;
};

/** Клиент Redis для публикации событий */
let redisPublisher: RedisClient | null = null;

/** Клиент Redis для подписки на события (отдельное соединение) */
let redisSubscriber: RedisClient | null = null;

/** Флаг успешной инициализации Redis */
let _available = false;

/**
 * Создаёт экземпляр ioredis по заданному URL
 * @param url - Redis URL для подключения
 * @returns Экземпляр Redis-клиента или null при ошибке
 */
async function createClient(url: string): Promise<RedisClient | null> {
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    await client.connect();
    return client as unknown as RedisClient;
  } catch {
    return null;
  }
}

/**
 * Инициализирует оба Redis-клиента (publisher и subscriber).
 * Вызывается один раз при старте сервера.
 */
async function initRedisClients(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) return;

  const [pub, sub] = await Promise.all([createClient(url), createClient(url)]);

  if (pub && sub) {
    redisPublisher = pub;
    redisSubscriber = sub;
    _available = true;
    console.log('[Redis] Клиенты publisher и subscriber инициализированы');
  } else {
    pub?.quit().catch(() => {});
    sub?.quit().catch(() => {});
    console.warn('[Redis] Не удалось инициализировать клиенты — Redis недоступен');
  }
}

/**
 * Возвращает true, если Redis доступен и клиенты инициализированы
 * @returns Признак доступности Redis
 */
function isRedisAvailable(): boolean {
  return _available;
}

/**
 * Возвращает текущий publisher клиент Redis (может быть null до инициализации)
 * @returns Redis publisher или null
 */
function getRedisPublisher(): RedisClient | null {
  return redisPublisher;
}

/**
 * Возвращает текущий subscriber клиент Redis (может быть null до инициализации)
 * @returns Redis subscriber или null
 */
function getRedisSubscriber(): RedisClient | null {
  return redisSubscriber;
}

/** Promise инициализации Redis — позволяет дождаться завершения перед использованием */
const redisInitPromise: Promise<void> = initRedisClients().catch((err) =>
  console.error('[Redis] Ошибка инициализации:', err)
);

/**
 * Ожидает завершения инициализации Redis-клиентов.
 * Используется в местах где нужен актуальный статус Redis до синхронного вызова.
 * @returns Promise завершения инициализации
 */
async function waitForRedisInit(): Promise<void> {
  await redisInitPromise;
}

export { redisPublisher, redisSubscriber, isRedisAvailable, getRedisPublisher, getRedisSubscriber, waitForRedisInit };
