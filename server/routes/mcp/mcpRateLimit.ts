/**
 * @fileoverview In-memory rate limiter для /mcp
 * @module server/routes/mcp/mcpRateLimit
 */

/** Запись счётчика окна */
interface WindowCounter {
  /** Число запросов в окне */
  count: number;
  /** Время сброса окна (ms epoch) */
  resetAt: number;
}

/** Параметры лимитера */
export interface McpRateLimitOptions {
  /** Макс. запросов за окно */
  max: number;
  /** Длина окна в мс */
  windowMs: number;
}

const DEFAULT_OPTS: McpRateLimitOptions = { max: 120, windowMs: 60_000 };

/** Счётчики по ключу (IP или ownerId) */
const buckets = new Map<string, WindowCounter>();

/**
 * Проверяет и инкрементирует лимит для ключа.
 * @param key - IP или id владельца токена
 * @param opts - Параметры окна
 * @returns true если запрос разрешён
 */
export function consumeMcpRateLimit(
  key: string,
  opts: McpRateLimitOptions = DEFAULT_OPTS,
): boolean {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  return entry.count <= opts.max;
}

/**
 * Сбрасывает все счётчики (для тестов).
 */
export function resetMcpRateLimitBuckets(): void {
  buckets.clear();
}
