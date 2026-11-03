/** @fileoverview Дополнительные действия версий и live-логов без изменения основного persistence. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts';
import { getVersionSnapshot, createVersionCheckpoint, getBotLog, clearBotLogs } from './version-log-extra-db';
/** Формирует результат MCP с явной ошибкой. */
function result(value: any) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) }; }
/** Регистрирует недостающие операции версий и логов. */
export function registerVersionLogExtraTools(server: McpServer): void {
  server.registerTool('db_get_version', { description: 'Читает сохранённый снимок версии без восстановления проекта.', inputSchema: { project_id: id, version_id: id }, annotations: { readOnlyHint: true }, _meta: { botcraft: { section: 'versions', effect: 'read' } } }, async ({ project_id, version_id }) => result(await getVersionSnapshot(project_id, version_id)));
  server.registerTool('db_create_checkpoint', { description: 'Создаёт именованный чекпоинт текущего сохранённого сценария без его перезаписи. Подтверждает чтением версии; повтор создаёт ещё одну версию.', inputSchema: { project_id: id, message: z.string().trim().min(1).max(1000) }, annotations: { readOnlyHint: false, idempotentHint: false }, _meta: { botcraft: { section: 'versions', effect: 'write' } } }, async ({ project_id, message }) => result(await createVersionCheckpoint(project_id, message)));
  server.registerTool('db_get_bot_log', { description: 'Читает запись лога по ID с проверкой доступа к проекту записи.', inputSchema: { log_id: id }, annotations: { readOnlyHint: true }, _meta: { botcraft: { section: 'logs', effect: 'read' } } }, async ({ log_id }) => result(await getBotLog(log_id)));
  server.registerTool('db_clear_bot_logs', { description: 'Очищает live-логи выбранного бота из базы и буфера. История запусков сохраняется. Необратимо.', inputSchema: { project_id: id, token_id: id }, annotations: { readOnlyHint: false, destructiveHint: true }, _meta: { botcraft: { section: 'logs', effect: 'write' } } }, async ({ project_id, token_id }) => result(await clearBotLogs(project_id, token_id)));
}
