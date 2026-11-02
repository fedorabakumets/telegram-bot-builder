/** @fileoverview Маскирование одноразовых start-кодов в стандартной истории и публичных событиях. */
/**
 * Копирует JSON-подобную структуру, скрывая auth-коды в строках и ключах без изменения Date.
 * @param value - Данные для хранения диалога либо публичного ответа.
 * @returns Копия того же типа с масками; исходные runtime-переменные остаются доступными обработчику входа.
 */
export function safeAuthPayloads<T>(value: T): T {
  const seen = new WeakMap<object, unknown>();
  /** Маскирует только зарезервированный формат одноразового кода. */
  const redact = (text: string) => text.replace(/link_[A-Za-z0-9_-]+/gi, 'link_[скрыто]');
  /** Копирует вложенные данные, сохраняя повторные ссылки без бесконечной рекурсии. */
  const visit = (item: unknown): unknown => {
    if (typeof item === 'string') return redact(item);
    if (item === null || typeof item !== 'object' || item instanceof Date) return item;
    if (seen.has(item)) return seen.get(item);
    if (Array.isArray(item)) {
      const result: unknown[] = [];
      seen.set(item, result);
      for (const child of item) result.push(visit(child));
      return result;
    }
    const result: Record<string, unknown> = {};
    seen.set(item, result);
    for (const [key, child] of Object.entries(item)) Object.defineProperty(result, redact(key), {
      value: visit(child), enumerable: true, writable: true, configurable: true,
    });
    return result;
  };
  return visit(value) as T;
}
