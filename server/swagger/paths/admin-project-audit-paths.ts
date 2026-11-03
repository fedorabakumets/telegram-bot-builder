/** @fileoverview Точные ответы административных маршрутов; операции не предназначены для MCP. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { AdminProjectResponseSchema, AdminAuditResponseSchema, AdminTokenSecretSchema, AdminMessageErrorSchema, AdminErrorSchema } from '../schemas/admin-project-audit';
/** Формирует JSON-ответ. @param description - Описание. @param schema - Схема. @returns Ответ OpenAPI. */
function json(description: string, schema: z.ZodTypeAny) { return { description, content: { 'application/json': { schema } } }; }
/** Регистрирует административные обработчики. @param registry - Реестр. @returns Завершение регистрации. */
export function registerAdminProjectAuditPaths(registry: OpenAPIRegistry): void {
  const base = { tags: ['admin'], security: [{ adminCookie: [] }] };
  const auth = { 401: json('Нет административной cookie', AdminErrorSchema), 302: {
    description: 'При Accept: text/html перенаправление на /admin/login', content: { 'text/html': { schema: z.string() }, 'text/plain': { schema: z.string() } },
  } };
  const params = z.object({ id: z.string().openapi({ description: 'Числовой идентификатор проекта; проверяется обработчиком' }) });
  registry.registerPath({ ...base, method: 'get', path: '/admin/api/projects/{id}', summary: 'Проект и проекция владельца',
    description: 'Возвращает запись проекта из хранилища и безопасную проекцию владельца. Не включается в MCP.', request: { params },
    responses: { 200: json('Проект и владелец', AdminProjectResponseSchema), 400: json('Неверный идентификатор', AdminMessageErrorSchema),
      404: json('Проект не найден', AdminMessageErrorSchema), ...auth } });
  registry.registerPath({ ...base, method: 'get', path: '/admin/api/projects/{id}/audit', summary: 'Журнал действий проекта', request: { params },
    description: 'Последние 100 записей без тел запросов и секретов. Для отсутствующего проекта возвращается пустой items, не 404.',
    responses: { 200: json('Журнал проекта', AdminAuditResponseSchema), 400: json('Нужен положительный безопасный целый ID', AdminErrorSchema),
      500: json('Ошибка загрузки журнала', AdminErrorSchema), ...auth } });
  registry.registerPath({ ...base, method: 'get', path: '/admin/api/projects/{id}/secrets/bot-token/{tokenId}', summary: 'Явное раскрытие токена бота',
    description: 'Существующий административный маршрут. Секрет не приводится в примерах; не публикуется в MCP.',
    request: { params: params.extend({ tokenId: z.string() }) }, responses: { 200: json('Секрет проекта', AdminTokenSecretSchema),
      400: json('Неверные идентификаторы', AdminMessageErrorSchema), 404: json('Токен отсутствует либо принадлежит другому проекту', AdminMessageErrorSchema), ...auth } });
}
