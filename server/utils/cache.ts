/**
 * @fileoverview Простой in-memory кеш для API запросов
 *
 * Этот файл предоставляет простую реализацию кеша в памяти для хранения
 * временных данных с возможностью автоматической очистки просроченных записей.
 */

/**
 * Интерфейс для элемента кеша
 * @template T - Тип данных, хранимых в кеше
 */
interface CacheEntry<T> {
  data: T;           // Данные, хранимые в кеше
  timestamp: number; // Время создания записи в миллисекундах
  ttl: number;       // Время жизни в миллисекундах (time to live)
}

/**
 * Простой класс кеша в памяти
 * Предоставляет методы для установки, получения и управления кешированными данными
 */
class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Устанавливает значение в кеш
   * @param key Ключ для хранения данных
   * @param data Данные для кеширования
   * @param ttlMs Время жизни в миллисекундах (по умолчанию 60000 мс = 1 минута)
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Получает значение из кеша
   * @param key Ключ для получения данных
   * @returns Кешированные данные или null, если ключ не найден или срок действия истек
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Удаляет значение из кеша по ключу
   * @param key Ключ для удаления
   * @returns true, если элемент был удален, иначе false
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Очищает весь кеш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Автоматическая очистка просроченных записей
   * Удаляет все записи, срок жизни которых истек
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Возвращает статистику кеша
   * @returns Объект с информацией о размере кеша и ключах
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Экземпляр кеша для сервера
 */
export const serverCache = new SimpleCache();

/**
 * Интервал для автоматической очистки кеша
 */
let cleanupInterval: NodeJS.Timeout | null = null;

// Запускаем очистку кеша каждые 5 минут
cleanupInterval = setInterval(() => {
  serverCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Функция для остановки автоматической очистки кеша
 * Может использоваться при завершении работы приложения
 */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Хелпер для кеширования с проверкой
 * Проверяет наличие данных в кеше, и если их нет, выполняет функцию и кеширует результат
 *
 * @template T - Тип возвращаемых данных
 * @param key Ключ для кеширования
 * @param fn Функция, возвращающая Promise с данными
 * @param ttlMs Время жизни кешированных данных в миллисекундах (по умолчанию 60000 мс = 1 минута)
 * @returns Promise с кешированными или новыми данными
 */
export function getCachedOrExecute<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  const cached = serverCache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fn().then(result => {
    serverCache.set(key, result, ttlMs);
    return result;
  });
}