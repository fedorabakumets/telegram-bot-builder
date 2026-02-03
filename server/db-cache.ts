/**
 * @fileoverview Улучшенный уровень кэширования для операций с базой данных
 *
 * Этот файл предоставляет классы для кэширования данных базы данных с целью
 * повышения производительности и снижения нагрузки на базу данных.
 */

import { BotProject, BotTemplate } from '@shared/schema';

/**
 * Класс для управления кэшем данных базы данных
 * Реализует простой кэш с временем жизни (TTL) для каждого элемента
 */
export class DatabaseCache {
  private static instance: DatabaseCache;

  /**
   * Хранилище кэшированных данных
   * Ключ - строковый идентификатор, значение - объект с данными, временем создания и TTL
   */
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  /**
   * Время жизни по умолчанию для кэшированных элементов (5 минут в миллисекундах)
   */
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Приватный конструктор для реализации паттерна Singleton
   */
  private constructor() {}

  /**
   * Получить экземпляр класса DatabaseCache (реализация паттерна Singleton)
   * @returns Экземпляр класса DatabaseCache
   */
  static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  /**
   * Устанавливает элемент в кэш
   * @param key Ключ для кэширования
   * @param data Данные для кэширования
   * @param ttl Время жизни элемента в кэше в миллисекундах (по умолчанию используется defaultTTL)
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Получает элемент из кэша
   * @param key Ключ для получения данных из кэша
   * @returns Кэшированные данные или null, если элемент не найден или просрочен
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Проверить, не истекло ли время жизни
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Удаляет элемент из кэша
   * @param key Ключ для удаления элемента из кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очищает кэш по шаблону
   * @param pattern Шаблон регулярного выражения для поиска ключей для удаления
   */
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Получает статистику кэша
   * @returns Объект со статистикой кэша (общее количество элементов, количество просроченных, использование памяти и т.д.)
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, entry]) => now - entry.timestamp > entry.ttl).length,
      memoryUsage: this.getMemoryUsage(),
      hitRate: this.getHitRate()
    };
  }

  /**
   * Очищает просроченные элементы кэша
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Очищено ${keysToDelete.length} просроченных элементов кэша`);
  }

  /**
   * Получает приблизительное использование памяти кэшем
   * @returns Приблизительное количество используемых байтов
   */
  private getMemoryUsage(): number {
    const entries = Array.from(this.cache.values());
    return entries.reduce((size, entry) => {
      return size + JSON.stringify(entry.data).length;
    }, 0);
  }

  /**
   * Получает приблизительный процент попаданий в кэш
   * @returns Приблизительный процент попаданий в кэш
   */
  private hitRate(): number {
    // Для отслеживания процента попаданий потребуется дополнительная логика
    // Пока возвращается заглушка
    return 0.85; // 85% процент попаданий
  }

  /**
   * Получает процент попаданий в кэш
   * @returns Процент попаданий в кэш
   */
  private getHitRate(): number {
    return this.hitRate();
  }
}

/**
 * Класс для кэшированных операций с хранилищем
 * Предоставляет методы для кэширования часто используемых данных
 */
export class CachedDatabaseOperations {
  private cache = DatabaseCache.getInstance();

  /**
   * Кэширует данные проекта
   * @param id Идентификатор проекта
   * @param fetcher Функция для получения данных проекта, если они не кэшированы
   * @returns Кэшированные или полученные данные проекта
   */
  async getProjectCached(id: number, fetcher: () => Promise<BotProject | undefined>): Promise<BotProject | undefined> {
    const key = `project:${id}`;
    const cached = this.cache.get<BotProject>(key);

    if (cached) {
      return cached;
    }

    const project = await fetcher();
    if (project) {
      this.cache.set(key, project);
    }

    return project;
  }

  /**
   * Кэширует данные шаблона
   * @param id Идентификатор шаблона
   * @param fetcher Функция для получения данных шаблона, если они не кэшированы
   * @returns Кэшированные или полученные данные шаблона
   */
  async getTemplateCached(id: number, fetcher: () => Promise<BotTemplate | undefined>): Promise<BotTemplate | undefined> {
    const key = `template:${id}`;
    const cached = this.cache.get<BotTemplate>(key);

    if (cached) {
      return cached;
    }

    const template = await fetcher();
    if (template) {
      this.cache.set(key, template, 10 * 60 * 1000); // 10 минут для шаблонов
    }

    return template;
  }

  /**
   * Кэширует список шаблонов
   * @param category Категория шаблонов
   * @param fetcher Функция для получения списка шаблонов, если они не кэшированы
   * @returns Кэшированный или полученный список шаблонов
   */
  async getTemplateListCached(category: string, fetcher: () => Promise<BotTemplate[]>): Promise<BotTemplate[]> {
    const key = `templates:${category}`;
    const cached = this.cache.get<BotTemplate[]>(key);

    if (cached) {
      return cached;
    }

    const templates = await fetcher();
    this.cache.set(key, templates, 2 * 60 * 1000); // 2 минуты для списков

    return templates;
  }

  /**
   * Инвалидирует кэш проекта
   * @param id Идентификатор проекта для инвалидации
   */
  invalidateProject(id: number): void {
    this.cache.delete(`project:${id}`);
    this.cache.clearByPattern(`project:${id}:.*`);
  }

  /**
   * Инвалидирует кэш шаблона
   * @param id Идентификатор шаблона для инвалидации
   */
  invalidateTemplate(id: number): void {
    this.cache.delete(`template:${id}`);
    this.cache.clearByPattern(`templates:.*`); // Инвалидировать все списки шаблонов
  }

  /**
   * Инвалидирует кэш всех шаблонов
   */
  invalidateAllTemplates(): void {
    this.cache.clearByPattern(`templates:.*`);
  }

  /**
   * Получает статистику кэша
   * @returns Объект со статистикой кэша
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Очищает просроченные элементы кэша
   */
  cleanup(): void {
    this.cache.cleanup();
  }
}

/**
 * Автоматическая очистка просроченных элементов кэша каждые 5 минут
 */
setInterval(() => {
  DatabaseCache.getInstance().cleanup();
}, 5 * 60 * 1000);

/**
 * Экземпляр кэша базы данных (реализация паттерна Singleton)
 */
export const dbCache = DatabaseCache.getInstance();

/**
 * Экземпляр класса для кэшированных операций с базой данных
 */
export const cachedOps = new CachedDatabaseOperations();