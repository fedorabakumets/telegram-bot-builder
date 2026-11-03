/** @fileoverview MCP каталога и личных шаблонов с общими HTTP схемами. */
import { actionRequestIdSchema } from '../../shared/action-request-id';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts';
import { createBotTemplateBodySchema, updateBotTemplateBodySchema } from '../../shared/schema/template-contracts';
import { templatesRequest } from './templates-db';
/** Возвращает результат MCP с корректным признаком ошибки. */
function result(value: any) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) }; }
/** Регистрирует каталог и CRUD собственных шаблонов. */
export function registerTemplateTools(server: McpServer): void {
  server.registerTool('db_list_templates', { description: 'Читает доступные пользователю публичные и личные шаблоны.', inputSchema: {}, annotations: { readOnlyHint: true }, _meta: { botcraft: { section: 'templates', effect: 'read' } } }, async () => result(await templatesRequest()));
  server.registerTool('db_get_template', { description: 'Читает доступный шаблон со сценарием.', inputSchema: { template_id: id }, annotations: { readOnlyHint: true }, _meta: { botcraft: { section: 'templates', effect: 'read' } } }, async ({ template_id }) => result(await templatesRequest('GET', template_id)));
  server.registerTool('db_create_template', { description: 'Сохраняет личный шаблон. ownerId и featured назначает сервер; публикация isPublic имеет внешний эффект.', inputSchema: createBotTemplateBodySchema.shape, annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true }, _meta: { botcraft: { section: 'templates', effect: 'write' } } }, async (body) => result(await templatesRequest('POST', undefined, body)));
  server.registerTool('db_update_template', { description: 'Сохраняет изменения собственного шаблона. Чужие шаблоны сервер запрещает изменять.', inputSchema: { template_id: id, ...updateBotTemplateBodySchema.shape }, annotations: { readOnlyHint: false, openWorldHint: true }, _meta: { botcraft: { section: 'templates', effect: 'write' } } }, async ({ template_id, ...body }) => result(await templatesRequest('PUT', template_id, body)));
  server.registerTool('db_delete_template', { description: 'Удаляет собственный шаблон. Необратимо.', inputSchema: { template_id: id }, annotations: { readOnlyHint: false, destructiveHint: true }, _meta: { botcraft: { section: 'templates', effect: 'write' } } }, async ({ template_id }) => result(await templatesRequest('DELETE', template_id)));
  server.registerTool('db_use_template', { description: 'Копирует доступный шаблон в новый проект и личную коллекцию. Повторный вызов создаёт новую копию.', inputSchema: { template_id: id, requestId: actionRequestIdSchema }, annotations: { readOnlyHint: false, idempotentHint: false }, _meta: { botcraft: { section: 'templates', effect: 'write' } } }, async ({ template_id, requestId }) => result(await templatesRequest('POST', template_id, { requestId }, true)));
}
