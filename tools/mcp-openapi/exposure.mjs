/** @fileoverview Закрытая политика публикации второго адаптера: только выбранные операции без секретов и самовыдачи прав. */
/**
 * Проверяет разрешённый маршрут и тег; неизвестные формы не публикуются.
 * @param {string} route - Путь OpenAPI.
 * @param {unknown} operation - Контракт операции.
 * @param {string} method - Метод HTTP, отсутствие не даёт доступа.
 * @returns {boolean} Допустимость включения в ограниченный адаптер.
 */
export function mayExposeOperation(route, operation, method) {
  if (!operation || typeof operation !== 'object') return false;
  if (!route.startsWith('/api/')) return false;
  if (/\/agent-tokens(?:\/|$)|\/env(?:\/|$)|\/collaborators(?:\/|$)|\/secrets(?:\/|$)|\/admin(?:\/|$)|\/tokens(?:\/|$)/.test(route)) return false;
  const tags = operation.tags;
  const allowed = ['project-tokens', 'project-bot', 'projects', 'health', 'bots', 'tokens'];
  /** Явный перечень проверенных операций: новый путь не открывается благодаря одному тегу. */
  const reviewed = new Set([
    'get /api/health', 'get /api/bots', 'get /api/projects', 'get /api/projects/{id}',
    'get /api/projects/{id}/bot/statuses',
  ]);
  return reviewed.has(`${method?.toLowerCase()} ${route}`) && Array.isArray(tags) && tags.length > 0 && tags.every((tag) => allowed.includes(tag));
}
