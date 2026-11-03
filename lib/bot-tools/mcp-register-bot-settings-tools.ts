/** @fileoverview MCP настроек бота и ENV без раскрытия сохранённых секретов. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts';
import { insertBotEnvVariableSchema } from '../../shared/schema/tables/bot-env-variables';
import { botSettingsChangeSchema, botProfileBodySchema } from '../../shared/schema/bot-settings-contracts';
import { userDataRequest } from './user-data-db';
import { getBotSettings, setBotSettings, setBotProfile, botEnvRequest } from './bot-settings-db';
/** Создаёт ответ MCP. */
function result(value: any) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) }; }
/** Регистрирует чтение и безопасные изменения настроек. */
export function registerBotSettingsTools(server: McpServer): void {
  const base = { project_id: id, token_id: id };
  server.registerTool('db_get_bot_settings', {
    description: 'Читает настройки и публичный профиль бота. Токены, webhook secret и userbot credentials исключены.', inputSchema: base,
    annotations: { readOnlyHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'bots', effect: 'read' } },
  }, async ({ project_id, token_id }) => result(await getBotSettings(project_id, token_id)));
  server.registerTool('db_set_bot_settings', {
    description: 'Сохраняет разрешённую настройку и подтверждает повторным чтением. Не перезапускает бота; сохранение и применение работающим процессом различаются.',
    inputSchema: { ...base, change: botSettingsChangeSchema },
    annotations: { readOnlyHint: false, openWorldHint: true }, _meta: { botcraft: { section: 'bots', effect: 'write' } },
  }, async ({ project_id, token_id, change }) => result(await setBotSettings(project_id, token_id, change)));
  server.registerTool('db_set_bot_profile', {
    description: 'Изменяет публичный профиль бота через Telegram и сохраняет кеш профиля. Не меняет username.', inputSchema: { ...base, ...botProfileBodySchema.shape },
    annotations: { readOnlyHint: false, openWorldHint: true }, _meta: { botcraft: { section: 'bots', effect: 'external' } },
  }, async ({ project_id, token_id, ...body }) => result(await setBotProfile(project_id, token_id, body)));
  server.registerTool('db_list_bot_env', {
    description: 'Читает имена и метаданные ENV. Все значения исключены, включая несекретные; reveal отсутствует.', inputSchema: base,
    annotations: { readOnlyHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'bots', effect: 'read' } },
  }, async ({ project_id, token_id }) => result(await botEnvRequest(project_id, token_id)));
  const env = insertBotEnvVariableSchema.omit({ tokenId: true }).extend({ value: z.string().max(65536), isSecret: z.union([z.literal(0), z.literal(1)]).default(1) });
  server.registerTool('db_create_bot_env', {
    description: 'Сохраняет новую пользовательскую ENV. Значение не возвращается. Для применения требуется перезапуск.', inputSchema: { ...base, ...env.shape },
    annotations: { readOnlyHint: false, openWorldHint: false }, _meta: { botcraft: { section: 'bots', effect: 'write' } },
  }, async ({ project_id, token_id, ...body }) => result(await botEnvRequest(project_id, token_id, 'POST', undefined, body)));
  server.registerTool('db_update_bot_env', {
    description: 'Изменяет существующую пользовательскую ENV выбранного бота. Значение не возвращается.', inputSchema: { ...base, variable_id: id, ...env.partial().shape },
    annotations: { readOnlyHint: false, openWorldHint: false }, _meta: { botcraft: { section: 'bots', effect: 'write' } },
  }, async ({ project_id, token_id, variable_id, ...body }) => result(await botEnvRequest(project_id, token_id, 'PUT', variable_id, body)));
  server.registerTool('db_delete_bot_env', {
    description: 'Удаляет пользовательскую ENV выбранного бота. Для применения требуется перезапуск.', inputSchema: { ...base, variable_id: id },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'bots', effect: 'write' } },
  }, async ({ project_id, token_id, variable_id }) => result(await botEnvRequest(project_id, token_id, 'DELETE', variable_id)));
  server.registerTool('db_get_bot_admin_ids', {
    description: 'Читает сохранённые ID администраторов бота. Не выдаёт новых прав; запись административных ID намеренно не открыта.',
    inputSchema: { project_id: id }, annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'bots', effect: 'read' } },
  }, async ({ project_id }) => result(await userDataRequest(`/api/projects/${project_id}/admin-ids`)));

}
