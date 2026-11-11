/** @fileoverview Ограниченный кэш аватаров с объединением запросов и защитой от перегрузки. */
import { createHash } from 'node:crypto';
import type { BotUserPhotoInput } from './bot-user-photo-input';
export type { BotUserPhotoInput } from './bot-user-photo-input';

/** Зависимости кэша для рабочего транспорта и изолированных проверок. */
export interface PhotoCacheDependencies {
  /** Загружает аватар; отсутствие возвращает null, ошибки отклоняют запрос. */
  load: (input: BotUserPhotoInput) => Promise<string | null>;
  /** Возвращает текущее время в миллисекундах. */
  now?: () => number;
}

/** Сохранённый результат с конечным сроком действия. */
interface Entry {
  /** Идентификатор файла либо отсутствие аватара. */
  fileId: string | null;
  /** Время окончания срока действия. */
  expiresAt: number;
}

/**
 * Создаёт кэш на 1000 записей и допускает не более четырёх одновременных операций.
 * @param dependencies - Транспорт и часы.
 * @returns Получение идентификатора; перегрузка и ошибки дают null без очереди ожидания.
 */
export function createBotUserPhotoCache(dependencies: PhotoCacheDependencies) {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<string | null>>();
  const now = dependencies.now ?? Date.now;
  let activeLoads = 0;

  /**
   * Сохраняет результат и вытесняет наиболее давно использованную запись.
   * @param key - Изолированный ключ кэша.
   * @param fileId - Идентификатор файла или отсутствие.
   * @param ttl - Срок хранения в миллисекундах.
   * @returns Сохранённое значение.
   */
  function remember(key: string, fileId: string | null, ttl: number): string | null {
    entries.delete(key);
    entries.set(key, { fileId, expiresAt: now() + ttl });
    if (entries.size > 1000) entries.delete(entries.keys().next().value!);
    return fileId;
  }

  /**
   * Проверяет срок, при необходимости запрашивает свежий аватар.
   * @param input - Параметры аватара.
   * @param key - Изолированный ключ кэша.
   * @returns Идентификатор файла или отсутствие.
   */
  async function resolve(input: BotUserPhotoInput, key: string): Promise<string | null> {
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now()) {
      entries.delete(key);
      entries.set(key, cached);
      return cached.fileId;
    }
    entries.delete(key);
    if (activeLoads >= 4) return null;
    activeLoads++;
    try {
      const fileId = await dependencies.load(input);
      return remember(key, fileId, fileId === null ? 300_000 : 3_600_000);
    } finally {
      activeLoads--;
    }
  }

  /**
   * Возвращает общий результат параллельных запросов одного аватара.
   * @param input - Параметры пользователя и бота.
   * @returns Идентификатор файла или отсутствие при ошибке и перегрузке.
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
