/** @fileoverview Регистрация внешних действий сообщений и отмены проверки доступности. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { actionRequestIdSchema } from '../../shared/action-request-id';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts.ts';
import { dialogMessageBodySchema, editDialogMessageBodySchema } from '../../shared/schema/dialog-write-contracts.ts';
import { userDataRequest } from './user-data-db.ts';
import { writeDialogMessage, mutateDialogMessage, cancelDialogAccessCheck } from './dialog-write-db.ts';
/** Формирует ответ MCP с признаком ошибки. */
function result(value: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) };
}
/** Регистрирует фиксированные операции диалогов. */
export function registerDialogWriteTools(server: McpServer): void {
  const base = { project_id: id, token_id: id };
  server.registerTool('db_send_dialog_message', {
    description: 'Отправляет реальное сообщение пользователю Telegram и сохраняет его в истории. requestId обязателен: повтор той же заявки не отправляет сообщение повторно; неизвестный исход запрещает повторное исполнение.',
    inputSchema: { ...base, requestId: actionRequestIdSchema, user_id: z.string().regex(/^[1-9]\d{0,19}$/), ...dialogMessageBodySchema.shape },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, user_id, ...body }) => result(await writeDialogMessage(project_id, token_id, user_id, 'send-message', body)));
  server.registerTool('db_send_node_message', {
    description: 'Отправляет пользователю реальное сообщение из ноды. Не является предпросмотром; после неизвестного исхода не повторять автоматически.',
    inputSchema: { ...base, requestId: actionRequestIdSchema, user_id: z.string().regex(/^[1-9]\d{0,19}$/), nodeId: z.string().min(1).max(200), userData: z.record(z.string(), z.unknown()).optional() },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, user_id, ...body }) => result(await writeDialogMessage(project_id, token_id, user_id, 'send-node-message', body)));
  server.registerTool('db_edit_dialog_message', {
    description: 'Изменяет отправленное сообщение Telegram и сохранённую историю.',
    inputSchema: { ...base, message_id: id, ...editDialogMessageBodySchema.shape },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, message_id, ...body }) => result(await mutateDialogMessage(project_id, token_id, message_id, 'PATCH', body)));
  server.registerTool('db_delete_dialog_message', {
    description: 'Удаляет сообщение из Telegram и сохранённой истории. Необратимо.',
    inputSchema: { ...base, message_id: id },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, message_id }) => result(await mutateDialogMessage(project_id, token_id, message_id, 'DELETE')));
  server.registerTool('db_cancel_chat_access_check', {
    description: 'Останавливает оставшуюся очередь проверки доступности. Уже выполненные проверки сохраняются; состояние может быть cancelling.',
    inputSchema: { ...base, job_id: id },
    annotations: { readOnlyHint: false, openWorldHint: false },
    _meta: { botcraft: { section: 'dialogs', effect: 'write' } },
  }, async ({ project_id, token_id, job_id }) => result(await cancelDialogAccessCheck(project_id, token_id, String(job_id))));
  server.registerTool('db_sync_dialog_group', {
    description: 'Обновляет сохранённые сведения о группе через Telegram. Не отправляет сообщение.',
    inputSchema: { ...base, group_id: z.string().regex(/^-?[1-9]\d{0,19}$/) },
    annotations: { readOnlyHint: false, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, group_id }) => result(await userDataRequest(`/api/projects/${project_id}/groups/${encodeURIComponent(group_id)}/sync?tokenId=${token_id}`, 'POST')));
  server.registerTool('db_clear_dialog_history', {
    description: 'Удаляет сохранённую историю пользователя из приложения; не удаляет сообщения в Telegram.',
    inputSchema: { ...base, user_id: z.string().regex(/^[1-9]\d{0,19}$/) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'dialogs', effect: 'write' } },
  }, async ({ project_id, token_id, user_id }) => result(await userDataRequest(`/api/projects/${project_id}/users/${encodeURIComponent(user_id)}/messages?tokenId=${token_id}`, 'DELETE')));
  server.registerTool('db_send_group_message', {
    description: 'Отправляет реальное сообщение в группу Telegram. requestId обязателен, используйте тот же ID при сверке результата.',
    inputSchema: { ...base, requestId: actionRequestIdSchema, group_id: z.string().regex(/^-?[1-9]\d{0,19}$/), ...dialogMessageBodySchema.shape },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
    _meta: { botcraft: { section: 'dialogs', effect: 'external' } },
  }, async ({ project_id, token_id, group_id, messageText, ...body }) => result(await userDataRequest(`/api/projects/${project_id}/bot/send-group-message?tokenId=${token_id}`, 'POST', { ...body, groupId: group_id, message: messageText })));

}
