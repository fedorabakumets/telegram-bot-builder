/** @fileoverview Ограниченный кэш аватаров с объединением запросов и защитой от перегрузки. */
import { createHash } from 'node:crypto';

/** Параметры аватара, изолированного по проекту и учётным данным. */
export interface BotUserPhotoInput {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор записи токена. */
  tokenId: number;
  /** Секрет бота, используемый только транспортом и хешированием. */
  token: string;
  /** Идентификатор пользователя Telegram. */
  userId: string;
}

/** Зависимости кэша для рабочего транспорта и изолированных проверок. */
export interface PhotoCacheDependencies {
  /** Загружает аватар; отсутствие возвращает null, ошибки отклоняют запрос. */
  load: (input: BotUserPhotoInput) => Promise<string | null>;
  /** Проверяет наличие ранее сохранённого файла. */
  exists: (input: BotUserPhotoInput) => Promise<boolean>;
  /** Возвращает текущее время в миллисекундах. */
  now?: () => number;
}

/** Сохранённый результат с конечным сроком действия. */
interface Entry {
  /** Локальный адрес либо отсутствие аватара. */
  url: string | null;
  /** Время окончания срока действия. */
  expiresAt: number;
}

/**
 * Создаёт кэш на 1000 записей и допускает не более четырёх одновременных операций.
 * @param dependencies - Транспорт, проверка файла и часы.
 * @returns Получение адреса; перегрузка и ошибки дают null без очереди ожидания.
 */
export function createBotUserPhotoCache(dependencies: PhotoCacheDependencies) {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<string | null>>();
  const now = dependencies.now ?? Date.now;
  let activeLoads = 0;

  /**
   * Сохраняет результат и вытесняет наиболее давно использованную запись.
   * @param key - Изолированный ключ кэша.
   * @param url - Адрес аватара или отсутствие.
   * @param ttl - Срок хранения в миллисекундах.
   * @returns Сохранённое значение.
   */
  function remember(key: string, url: string | null, ttl: number): string | null {
    entries.delete(key);
    entries.set(key, { url, expiresAt: now() + ttl });
    if (entries.size > 1000) entries.delete(entries.keys().next().value!);
    return url;
  }

  /**
   * Проверяет срок и файл, при необходимости запрашивает свежий аватар.
   * @param input - Параметры аватара.
   * @param key - Изолированный ключ кэша.
   * @returns Адрес аватара или отсутствие.
   */
  async function resolve(input: BotUserPhotoInput, key: string): Promise<string | null> {
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now()) {
      if (cached.url === null || await dependencies.exists(input)) {
        entries.delete(key);
        entries.set(key, cached);
        return cached.url;
      }
    }
    entries.delete(key);
    if (activeLoads >= 4) return null;
    activeLoads++;
    try {
      const url = await dependencies.load(input);
      return remember(key, url, url === null ? 300_000 : 3_600_000);
    } finally {
      activeLoads--;
    }
  }

  /**
   * Возвращает общий результат параллельных запросов одного аватара.
   * @param input - Параметры пользователя и бота.
   * @returns Адрес аватара или отсутствие при ошибке и перегрузке.
   */
  return function getPhoto(input: BotUserPhotoInput): Promise<string | null> {
    const credential = createHash('sha256').update(input.token).digest('hex');
    const key = `${input.projectId}:${input.tokenId}:${input.userId}:${credential}`;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 32) return Promise.resolve(null);
    const request = Promise.resolve().then(() => resolve(input, key))
      .catch(() => remember(key, null, 30_000))
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
