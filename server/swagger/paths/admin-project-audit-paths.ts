/**
 * @fileoverview OpenAPI для журнала действий административного редактора
 * @module swagger/paths/admin-project-audit-paths
 */

import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

/** Регистрирует маршрут журнала проекта */
export function registerAdminProjectAuditPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/admin/api/projects/{id}',
    tags: ['admin'],
    summary: 'Сведения о проекте для административного редактора',
    description: 'Возвращает проект и безопасные сведения о владельце без секретов.',
    security: [{ adminCookie: [] }],
    responses: {
      200: { description: 'Проект и владелец' },
      401: { description: 'Нет административной cookie' },
      404: { description: 'Проект не найден' },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/admin/api/projects/{id}/audit',
    tags: ['admin'],
    summary: 'Журнал действий администратора проекта',
    description: 'Возвращает последние административные действия проекта. Значения секретов и тело запросов не возвращаются.',
    security: [{ adminCookie: [] }],
    responses: {
      200: { description: 'Журнал проекта' },
      401: { description: 'Нет административной cookie' },
      404: { description: 'Проект не найден' },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/admin/api/projects/{id}/secrets/bot-token/{tokenId}',
    tags: ['admin'],
    summary: 'Явное раскрытие токена бота',
    description: 'Возвращает токен только по отдельному запросу. Значение не записывается в журнал.',
    security: [{ adminCookie: [] }],
    responses: {
      200: { description: 'Токен проекта' },
      401: { description: 'Нет административной cookie' },
      404: { description: 'Токен не найден' },
    },
  });
}
