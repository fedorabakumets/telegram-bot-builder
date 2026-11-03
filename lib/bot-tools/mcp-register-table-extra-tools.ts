/** @fileoverview Настройки столбцов и условное сохранение ячеек через общий API таблиц. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tableColumnSettingsSchema } from '../../shared/table-column-settings';
import { tableCellBatchSchema } from '../../shared/table-cell-edit';
import { tableRequest } from './bot-tables-http';
import { tableToolResult } from './mcp-table-result';
/** Безопасный идентификатор объекта приложения. */
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
/** Общая область таблицы. */
const scope = { project_id: id, table_id: id };
/** Ячейки строки, индексированные идентификатором столбца. */
const cells = z.record(z.string().regex(/^[1-9]\d*$/), z.string().max(10000));
/**
 * Регистрирует операции сохранения с проверкой исходных значений.
 * @param server - MCP-сервер.
 * @returns Ничего.
 */
export function registerTableExtraTools(server: McpServer): void {
  server.registerTool('db_set_table_column_settings', {
    description: 'Сохранить настройки пользовательского столбца: подпись, тип, обязательность, ограничения. Внутреннее имя не меняется. data заменяет настройки целиком, пропущенные поля получают defaults; _content недоступна.',
    inputSchema: { ...scope, column_id: id, data: tableColumnSettingsSchema },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    _meta: { botcraft: { section: 'tables', effect: 'write' } },
  }, async ({ project_id, table_id, column_id, data }) => tableToolResult(await tableRequest(`/api/projects/${project_id}/tables/${table_id}/columns/${column_id}/settings`, json('PUT', data))));
  server.registerTool('db_edit_table_cells', {
    description: 'Атомарно сохранить 1–5000 ячеек с before/after. При конфликте исходного значения HTTP 409 и ни одна ячейка не записана. Для _content меняется и сценарий. Возвращает сохранённые строки; доставка обновления интерфейсу отдельно не подтверждается.',
    inputSchema: { ...scope, ...tableCellBatchSchema.shape, request_id: z.string().uuid().optional().describe('Включает постоянный журнал и ответ-квитанцию ID вместо строк.') },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    _meta: { botcraft: { section: 'tables', effect: 'write' } },
  }, async ({ project_id, table_id, edits, request_id }) => tableToolResult(await tableRequest(`/api/projects/${project_id}/tables/${table_id}/cells/edit`, json('POST', { edits, ...(request_id ? { requestId: request_id } : {}) }))));
  server.registerTool('db_patch_table_row_expected', {
    description: 'Изменить ячейки строки только если expected содержит актуальное значение каждой изменяемой ячейки. HTTP 409 означает конфликт без записи. Для диапазона используйте db_edit_table_cells.',
    inputSchema: { ...scope, row_id: id, data: cells, expected: cells },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    _meta: { botcraft: { section: 'tables', effect: 'write' } },
  }, async ({ project_id, table_id, row_id, data, expected }) => tableToolResult(await tableRequest(`/api/projects/${project_id}/tables/${table_id}/rows/${row_id}`, json('PATCH', { data, expected }))));
}
/**
 * Формирует JSON-запрос без возможности подмены маршрута.
 * @param method - Разрешённый метод.
 * @param body - Проверенное тело запроса.
 * @returns Опции HTTP.
 */
function json(method: 'PUT' | 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
