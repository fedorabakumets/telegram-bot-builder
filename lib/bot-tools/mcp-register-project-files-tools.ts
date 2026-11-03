/** @fileoverview Регистрация файлового менеджера без чтения файлов сервера. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MEDIA_TYPES, COVER_TYPE, VALID_SOURCES, VALID_CATEGORIES } from '../../shared/schema/project-file-contracts';
import { userDataIdSchema as id } from '../../shared/schema/user-data-contracts';
import { updateMediaMetadataSchema } from '../../shared/schema/media-metadata-contracts';
import { updateProjectFileMetadata, markProjectFileUsed, projectFilesRequest, projectQuota, uploadProjectBytes } from './project-files-db';
/** Формирует ответ с ошибкой MCP. */
function result(value: any) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) }; }
/** Регистрирует чтение, удаление и ограниченную загрузку файлов проекта. */
export function registerProjectFilesTools(server: McpServer): void {
  server.registerTool('db_list_project_files', {
    description: 'Читает страницу файлов проекта с фильтрами. category обязателен; серверные пути не возвращаются.',
    inputSchema: { project_id: id, category: z.enum(VALID_CATEGORIES), tokenId: id.optional(), page: id.default(1), limit: z.number().int().min(1).max(100).default(50), fileName: z.string().max(200).optional(), mediaType: z.enum([...MEDIA_TYPES, COVER_TYPE]).optional(), dateFrom: z.string().datetime().optional(), dateTo: z.string().datetime().optional(), sizeMin: z.number().int().min(0).optional(), sizeMax: z.number().int().min(0).optional(), uploadedBy: id.optional(), storageConfigId: z.string().max(200).optional() },
    annotations: { readOnlyHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'files', effect: 'read' } },
  }, async ({ project_id, ...query }) => result(await projectFilesRequest(project_id, 'GET', query)));
  server.registerTool('db_get_storage_quota', {
    description: 'Читает квоту и использование хранилища проекта.', inputSchema: { project_id: id },
    annotations: { readOnlyHint: true, openWorldHint: false }, _meta: { botcraft: { section: 'files', effect: 'read' } },
  }, async ({ project_id }) => result(await projectQuota(project_id)));
  server.registerTool('db_delete_project_files', {
    description: 'Удаляет записи uploaded и пытается удалить физические объекты. При ошибках возвращает partial с отдельными счётчиками. Для incoming/outgoing удаляет сохранённые сообщения, содержащие файлы, а не сообщения Telegram.',
    inputSchema: { project_id: id, items: z.array(z.object({ id, source: z.enum(VALID_SOURCES) })).min(1).max(100) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true }, _meta: { botcraft: { section: 'files', effect: 'write' } },
  }, async ({ project_id, items }) => result(await projectFilesRequest(project_id, 'DELETE', {}, { items })));
  server.registerTool('db_upload_project_file', {
    description: 'Загружает переданные байты base64, максимум 2 МиБ. Не принимает пути файлов компьютера или сервера; имя без каталогов.',
    inputSchema: { project_id: id, file_name: z.string().min(1).max(160).regex(/^[^\\/\x00-\x1f]+$/), mime_type: z.string().min(1).max(100), base64: z.string().min(4).max(2796204).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/) },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false }, _meta: { botcraft: { section: 'files', effect: 'write' } },
  }, async ({ project_id, file_name, mime_type, base64 }) => result(await uploadProjectBytes(project_id, file_name, mime_type, base64)));
  server.registerTool('db_update_file_metadata', {
    description: 'Сохраняет описание, теги или публичность принадлежащего пользователю файла с подтверждением чтением. Путь, URL и владелец неизменяемы.',
    inputSchema: { media_id: id, ...updateMediaMetadataSchema.shape },
    annotations: { readOnlyHint: false, openWorldHint: true }, _meta: { botcraft: { section: 'files', effect: 'write' } },
  }, async ({ media_id, ...body }) => result(await updateProjectFileMetadata(media_id, body)));
  server.registerTool('db_mark_file_used', {
    description: 'Увеличивает счётчик использования принадлежащего пользователю файла. Повтор увеличивает его снова.',
    inputSchema: { media_id: id },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false }, _meta: { botcraft: { section: 'files', effect: 'write' } },
  }, async ({ media_id }) => result(await markProjectFileUsed(media_id)));

}
