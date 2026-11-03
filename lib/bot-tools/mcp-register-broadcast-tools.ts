/** @fileoverview Общая регистрация рассылок и кампаний с явными внешними эффектами. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { actionRequestIdSchema } from '../../shared/action-request-id';
import { remoteMediaReferenceSchema } from '../../shared/schema/media-reference-contracts';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts.ts';
import { createBroadcastBodySchema, previewAudienceBodySchema, editBroadcastBodySchema, editBroadcastCampaignBodySchema } from '../../shared/schema/broadcast-contracts.ts';
import { requestBroadcast } from './broadcasts-db.ts';
/** Преобразует ответ API в успешный или ошибочный результат MCP. */
function result(value: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) };
}
/** Регистрирует чтение, предпросмотр и реальные внешние операции рассылок. */
export function registerBroadcastTools(server: McpServer): void {
  server.registerTool('db_preview_broadcast_audience', {
    description: 'Оценивает аудиторию рассылки без отправки сообщений.',
    inputSchema: { project_id: id, ...previewAudienceBodySchema.shape },
    annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: { botcraft: { section: 'broadcasts', effect: 'read' } },
  }, async ({ project_id, ...body }) => result(await requestBroadcast(project_id, 'broadcasts', 'POST', '/preview-audience', body)));
  server.registerTool('db_start_broadcast', {
    description: 'СОЗДАЁТ И СРАЗУ ЗАПУСКАЕТ реальную рассылку. tokenIds создаёт кампанию по выбранным ботам. Это не черновик. requestId обязателен: повтор той же заявки не запускает новую очередь; новый ID означает новую рассылку.',
    inputSchema: { project_id: id, requestId: actionRequestIdSchema, ...createBroadcastBodySchema.extend({ mediaUrls: z.array(remoteMediaReferenceSchema).max(10).default([]) }).shape },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _meta: { botcraft: { section: 'broadcasts', effect: 'external' } },
  }, async ({ project_id, ...body }) => result(await requestBroadcast(project_id, 'broadcasts', 'POST', '', body, { tokenId: body.tokenId })));
  for (const resource of ['broadcasts', 'broadcast-campaigns'] as const) {
    const campaign = resource === 'broadcast-campaigns';
    const noun = campaign ? 'campaign' : 'broadcast';
    server.registerTool(`db_list_${campaign ? 'broadcast_campaigns' : 'broadcasts'}`, {
      description: campaign ? 'Читает кампании проекта и их текущие статусы.' : 'Читает страницу рассылок и их текущие статусы.',
      inputSchema: { project_id: id, token_id: id.optional(), page: id.default(1), limit: z.number().int().min(1).max(100).default(20) },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { botcraft: { section: 'broadcasts', effect: 'read' } },
    }, async ({ project_id, token_id, ...query }) => result(await requestBroadcast(project_id, resource, 'GET', '', undefined, { ...query, tokenId: token_id })));
    server.registerTool(`db_get_${noun}`, {
      description: 'Читает подробности и состояние выполнения. Повторяйте чтение для наблюдения за фоновой отправкой.',
      inputSchema: { project_id: id, resource_id: id },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { botcraft: { section: 'broadcasts', effect: 'read' } },
    }, async ({ project_id, resource_id }) => result(await requestBroadcast(project_id, resource, 'GET', `/${resource_id}`)));
    server.registerTool(`db_stop_${noun}`, {
      description: 'Останавливает оставшуюся очередь отправки; уже отправленные сообщения остаются.',
      inputSchema: { project_id: id, resource_id: id },
      annotations: { readOnlyHint: false, openWorldHint: true },
      _meta: { botcraft: { section: 'broadcasts', effect: 'external' } },
    }, async ({ project_id, resource_id }) => result(await requestBroadcast(project_id, resource, 'POST', `/${resource_id}/stop`)));
    server.registerTool(`db_edit_${noun}`, {
      description: 'Изменяет текст уже отправленных сообщений рассылки в Telegram. Возможны частичные результаты.',
      inputSchema: { project_id: id, resource_id: id, ...(campaign ? editBroadcastCampaignBodySchema.shape : editBroadcastBodySchema.shape) },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
      _meta: { botcraft: { section: 'broadcasts', effect: 'external' } },
    }, async ({ project_id, resource_id, ...body }) => result(await requestBroadcast(project_id, resource, 'PUT', `/${resource_id}`, body)));
    server.registerTool(`db_delete_${noun}`, {
      description: 'Удаляет рассылку и пытается удалить связанные отправленные сообщения Telegram. Необратимо; изучите частичные результаты.',
      inputSchema: { project_id: id, resource_id: id },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
      _meta: { botcraft: { section: 'broadcasts', effect: 'external' } },
    }, async ({ project_id, resource_id }) => result(await requestBroadcast(project_id, resource, 'DELETE', `/${resource_id}`)));
  }
}
