// Простой in-memory кеш для API запросов
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live в миллисекундах
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

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

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Автоматическая очистка просроченных записей
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Статистика кеша
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const serverCache = new SimpleCache();

// Запускаем очистку кеша каждые 5 минут
let cleanupInterval: NodeJS.Timeout | null = null;
cleanupInterval = setInterval(() => {
  serverCache.cleanup();
}, 5 * 60 * 1000);

// Экспорт функции для остановки очистки
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Хелпер для кеширования с проверкой
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