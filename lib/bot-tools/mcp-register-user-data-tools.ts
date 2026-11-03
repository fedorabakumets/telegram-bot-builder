/** @fileoverview Регистрация операций базы пользователей и структурированных ответов. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { userDataIdSchema as id, userDataQuerySchema, updateUserDataBodySchema } from '../../shared/schema/user-data-contracts.ts';
import { userDataRequest, listUserData, getUserVariables, updateUserData, deleteUserData } from './user-data-db.ts';
/** Преобразует API ответ в результат MCP с явной ошибкой. */
function result(value: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) };
}
/** Регистрирует операции чтения и сохранения пользователей. */
export function registerUserDataTools(server: McpServer): void {
  server.registerTool('db_list_users', {
    description: 'Читает страницу базы пользователей выбранного бота, включая userData с ответами и переменными. Не отправляет сообщений.',
    inputSchema: { project_id: id, ...userDataQuerySchema.shape },
    annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'users', effect: 'read' } },
  }, async ({ project_id, ...query }) => result(await listUserData(project_id, query)));
  server.registerTool('db_get_user_variables', {
    description: 'Читает сохранённые переменные пользователей выбранного бота в виде колонок и строк. Результат ограничен limit, это не все пользователи.',
    inputSchema: { project_id: id, token_id: id, limit: z.number().int().min(1).max(1000).default(200) },
    annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'users', effect: 'read' } },
  }, async ({ project_id, token_id, limit }) => result(await getUserVariables(project_id, token_id, limit)));
  server.registerTool('db_update_user', {
    description: 'Сохраняет isActive пользователя выбранного бота. Другие переменные сервер этим действием не изменяет.',
    inputSchema: { project_id: id, token_id: id, user_id: z.string().regex(/^[1-9]\d{0,19}$/), ...updateUserDataBodySchema.shape },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: { botcraft: { section: 'users', effect: 'write' } },
  }, async ({ project_id, token_id, user_id, ...body }) => result(await updateUserData(project_id, token_id, user_id, body)));
  server.registerTool('db_delete_user', {
    description: 'Удаляет сохранённые данные пользователя выбранного бота. Не блокирует пользователя в Telegram. Необратимо.',
    inputSchema: { project_id: id, token_id: id, user_id: z.string().regex(/^[1-9]\d{0,19}$/) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'users', effect: 'write' } },
  }, async ({ project_id, token_id, user_id }) => result(await deleteUserData(project_id, token_id, user_id)));
  server.registerTool('db_clear_users', {
    description: 'Атомарно удаляет всех пользователей и сообщения выбранного бота. Необратимо; не изменяет Telegram. Возвращает подтверждённое число удалённых записей.',
    inputSchema: { project_id: id, token_id: id },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'users', effect: 'write' } },
  }, async ({ project_id, token_id }) => result(await userDataRequest(`/api/projects/${project_id}/users?tokenId=${token_id}`, 'DELETE')));

  server.registerTool('db_get_user', {
    description: 'Читает точную карточку пользователя выбранного бота, включая userData с ответами и переменными. Не скачивает аватар и не вызывает Telegram.',
    inputSchema: { project_id: id, token_id: id, user_id: z.string().regex(/^[1-9]\d{0,19}$/) },
    annotations: { readOnlyHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'users', effect: 'read' } },
  }, async ({ project_id, token_id, user_id }) => result(await userDataRequest(`/api/projects/${project_id}/users/${user_id}?tokenId=${token_id}`)));
  server.registerTool('db_set_user_database_enabled', {
    description: 'Сохраняет включение базы пользователей проекта с обязательной ожидаемой ревизией. Не очищает существующие данные. Конфликт 409 требует перечитать проект.',
    inputSchema: { project_id: id, enabled: z.boolean(), expected_revision: z.number().int().min(0) },
    annotations: { readOnlyHint: false, openWorldHint: false }, _meta: { botcraft: { section: 'users', effect: 'write' } },
  }, async ({ project_id, enabled, expected_revision }) => {
    const value = await userDataRequest(`/api/projects/${project_id}`, 'PUT', { userDatabaseEnabled: enabled ? 1 : 0, expectedRevision: expected_revision });
    return result(value);
  });

}
