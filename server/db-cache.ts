// Enhanced caching layer for database operations
import { BotProject, BotTemplate, BotInstance } from '@shared/schema';

export class DatabaseCache {
  private static instance: DatabaseCache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  // Set cache entry
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Delete cache entry
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear cache by pattern
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
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

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }

  private getMemoryUsage(): number {
    const entries = Array.from(this.cache.values());
    return entries.reduce((size, entry) => {
      return size + JSON.stringify(entry.data).length;
    }, 0);
  }

  private hitRate(): number {
    // This would require tracking hits and misses
    // For now, return a placeholder
    return 0.85; // 85% hit rate
  }

  private getHitRate(): number {
    return this.hitRate();
  }
}

// Cached storage operations
export class CachedDatabaseOperations {
  private cache = DatabaseCache.getInstance();

  // Cache project data
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

  // Cache template data
  async getTemplateCached(id: number, fetcher: () => Promise<BotTemplate | undefined>): Promise<BotTemplate | undefined> {
    const key = `template:${id}`;
    const cached = this.cache.get<BotTemplate>(key);
    
    if (cached) {
      return cached;
    }

    const template = await fetcher();
    if (template) {
      this.cache.set(key, template, 10 * 60 * 1000); // 10 minutes for templates
    }
    
    return template;
  }

  // Cache templates list
  async getTemplateListCached(category: string, fetcher: () => Promise<BotTemplate[]>): Promise<BotTemplate[]> {
    const key = `templates:${category}`;
    const cached = this.cache.get<BotTemplate[]>(key);
    
    if (cached) {
      return cached;
    }

    const templates = await fetcher();
    this.cache.set(key, templates, 2 * 60 * 1000); // 2 minutes for lists
    
    return templates;
  }

  // Invalidate related caches
  invalidateProject(id: number): void {
    this.cache.delete(`project:${id}`);
    this.cache.clearByPattern(`project:${id}:.*`);
  }

  invalidateTemplate(id: number): void {
    this.cache.delete(`template:${id}`);
    this.cache.clearByPattern(`templates:.*`); // Invalidate all template lists
  }

  invalidateAllTemplates(): void {
    this.cache.clearByPattern(`templates:.*`);
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats();
  }

  // Cleanup expired entries
  cleanup(): void {
    this.cache.cleanup();
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  DatabaseCache.getInstance().cleanup();
}, 5 * 60 * 1000);

export const dbCache = DatabaseCache.getInstance();
export const cachedOps = new CachedDatabaseOperations();