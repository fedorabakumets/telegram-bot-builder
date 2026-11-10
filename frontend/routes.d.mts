/** @fileoverview Типы общих правил маршрутизации для конфигурации разработки. */
/** Регулярные выражения серверных маршрутов с границами пути. */
export const backendRoutePatterns: string[];
/**
 * Определяет, должен ли запрос обслуживаться сервером приложения.
 * @param pathname - Проверяемый путь запроса
 * @returns Признак серверного маршрута
 */
export function isBackendPath(pathname: string): boolean;
