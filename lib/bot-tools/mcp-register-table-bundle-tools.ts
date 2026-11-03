/** @fileoverview Встроенный перенос данных таблиц для remote MCP без доступа к файловой системе. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tableBundleSchema } from '../../shared/table-bundle-schema';
import { tableRequest, isTableError } from './bot-tables-http';
import { getTable, queryRows } from './bot-tables-read';
import { tableToolResult } from './mcp-table-result';
/** Проверенный положительный идентификатор. */
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
/**
 * Регистрирует предварительный просмотр/импорт пакета и выгрузку страницы.
 * @param server - MCP-сервер.
 * @returns Ничего.
 */
export function registerTableBundleTools(server: McpServer): void {
  server.registerTool('db_import_tables_data', {
    description: 'Перенести встроенный JSON таблиц версии 1 без файловых путей. Без confirm — только локальный preview (не проверка прав/конфликтов сервера). confirm=true сохраняет весь пакет через существующий API одной транзакцией. replace удаляет прежние строки; create тоже требует явного confirm. До 200 строк на таблицу.',
    inputSchema: { project_id: id, bundle: tableBundleSchema, mode: z.enum(['create', 'replace']), confirm: z.boolean().optional(), request_id: z.string().uuid().optional().describe('UUID попытки: результатом станет постоянная квитанция ID; unknown не повторять.') },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    _meta: { botcraft: { section: 'tables', effect: 'write' } },
  }, async ({ project_id, bundle, mode, confirm, request_id }) => {
    if (confirm !== true) return tableToolResult({ prepared: true, saved: false, preview: bundle.tables.map(table => ({ name: table.name, columns: table.columns.length, rows: table.rows.length })), mode });
    return tableToolResult(await tableRequest(`/api/projects/${project_id}/tables/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, confirm: true, tables: bundle.tables, ...(request_id ? { requestId: request_id } : {}) }) }));
  });
  server.registerTool('db_export_table_data', {
    description: 'Получить встроенный JSON одной страницы таблицы версии 1 без записи файла. До 200 строк; complete=false означает неполную выгрузку, next_offset указывает продолжение. Между страницами нет общего снимка. Для полного файла используйте локальный stdio export.',
    inputSchema: { project_id: id, table_id: id, offset: z.number().int().min(0).optional(), limit: z.number().int().min(1).max(200).optional() },
    annotations: { readOnlyHint: true }, _meta: { botcraft: { section: 'tables', effect: 'read' } },
  }, async ({ project_id, table_id, offset = 0, limit = 200 }) => {
    const schema = await getTable(project_id, table_id); if (isTableError(schema)) return tableToolResult(schema);
    const page = await queryRows(project_id, table_id, { offset, limit, sort: 'row_index' }); if (isTableError(page)) return tableToolResult(page);
    const value = schema as { table: { name: string }; columns: Array<{ id: number; name: string; settings?: unknown }> };
    const data = page as { rows: Array<{ data: Record<string, string> }>; total: number };
    if (!value.table || !Array.isArray(value.columns) || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total)) return tableToolResult({ error: 'Некорректный ответ API таблицы' });
    const end = offset + data.rows.length;
    return tableToolResult({ version: 1, tables: [{ name: value.table.name, columns: value.columns.map(column => column.name), columnSettings: value.columns.map(column => column.settings ?? {}), rows: data.rows.map(row => value.columns.map(column => row.data[String(column.id)] ?? '')) }], total: data.total, offset, complete: offset === 0 && end >= data.total, next_offset: end < data.total ? end : null });
  });
}
