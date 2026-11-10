/** @fileoverview Общие правила маршрутизации отдельного интерфейса. */
/** Границы серверных путей, одинаковые для development и production. */
export const backendRoutePatterns = ['/api', '/auth', '/admin', '/uploads', '/ws', '/webhook', '/health', '/docs', '/docs-json', '/mcp', '/api-docs']
  .map((prefix) => `^${prefix}(?:/|$|\\?)`);
/** Определяет маршруты, которые обслуживает только сервер приложения. */
export function isBackendPath(pathname) { return backendRoutePatterns.some((pattern) => new RegExp(pattern).test(pathname)); }
