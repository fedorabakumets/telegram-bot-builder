/** @fileoverview Проверка публичной метки против существующих пользовательских маршрутов start. */
/**
 * Находит первый конфликтующий маршрут в структуре проекта без изменения сценария.
 * @param data - Сохранённая структура проекта с листами.
 * @param code - Новая публичная метка.
 * @returns Идентификатор конфликта либо null.
 */
export function findStartConflict(data: unknown, code: string): string | null {
  const queue: unknown[] = [data];
  while (queue.length) {
    const item = queue.pop();
    if (!item || typeof item !== 'object') continue;
    if (Array.isArray(item)) { queue.push(...item); continue; }
    const node = item as Record<string, any>, settings = node.data;
    if (node.type === 'command_trigger' && settings?.command?.replace(/^\//, '') === 'start' && settings.autoTransitionTo) {
      const pattern = settings.deepLinkParam;
      if (typeof pattern === 'string' && pattern && (settings.deepLinkMatchMode === 'startsWith' ? code.startsWith(pattern) : code === pattern)) return String(node.id);
    }
    queue.push(...Object.values(node));
  }
  return null;
}
