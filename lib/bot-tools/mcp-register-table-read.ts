/**
 * @fileoverview MCP-инструменты чтения пользовательских таблиц
 * @module lib/bot-tools/mcp-register-table-read
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { countRows, findTables, getRow, getSummary, getTable, listColumns, listTables, queryRows } from './bot-tables-read.ts';
import { tableToolResult } from './mcp-table-result.ts';

const filterSchema = z.object({
  column_id: z.number().describe('Числовой id столбца из db_list_table_columns'),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'starts_with', 'ends_with',
    'filled', 'empty', 'greater_than', 'less_than',
  ]),
  value: z.string().max(500).optional(),
});

/**
 * Регистрирует инструменты чтения
 * @param server - MCP-сервер
 */
export function registerTableReadTools(server: McpServer): void {
  server.registerTool('db_list_tables', {
    description: 'Список пользовательских таблиц проекта. Системные таблицы пользователей и сообщений сюда не входят.',
    inputSchema: { project_id: z.number() },
  }, async ({ project_id }) => tableToolResult(await listTables(project_id)));

  server.registerTool('db_find_tables', {
    description: 'Найти пользовательские таблицы по части имени.',
    inputSchema: { project_id: z.number(), query: z.string(), limit: z.number().int().min(1).max(100).optional() },
  }, async ({ project_id, query, limit }) => tableToolResult(await findTables(project_id, query, limit)));

  server.registerTool('db_get_table', {
    description: 'Таблица, столбцы (имя и числовой id) и сводка заполненности.',
    inputSchema: { project_id: z.number(), table_id: z.number() },
  }, async ({ project_id, table_id }) => tableToolResult(await getTable(project_id, table_id)));

  server.registerTool('db_list_table_columns', {
    description: 'Столбцы таблицы: числовой id, имя и позиция. Ключи ячеек — эти id строками.',
    inputSchema: { project_id: z.number(), table_id: z.number() },
  }, async ({ project_id, table_id }) => tableToolResult(await listColumns(project_id, table_id)));

  server.registerTool('db_list_table_rows', {
    description: 'Страница строк. limit по умолчанию 100, максимум 500. sort: id, row_index или column:<id>.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      limit: z.number().int().min(1).max(500).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.string().optional(),
      columns: z.array(z.number()).optional(),
    },
  }, async ({ project_id, table_id, limit, offset, sort, columns }) => tableToolResult(
    await queryRows(project_id, table_id, { limit, offset, sort, columns }),
  ));

  server.registerTool('db_get_table_row', {
    description: 'Одна строка таблицы проекта.',
    inputSchema: { project_id: z.number(), table_id: z.number(), row_id: z.number() },
  }, async ({ project_id, table_id, row_id }) => tableToolResult(await getRow(project_id, table_id, row_id)));

  server.registerTool('db_find_table_rows', {
    description: 'Поиск строк: до 5 условий, без произвольного SQL. Операторы equals, not_equals, contains, starts_with, ends_with, filled, empty, greater_than, less_than.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      filters: z.array(filterSchema).max(5),
      limit: z.number().int().min(1).max(500).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.string().optional(),
      columns: z.array(z.number()).optional(),
    },
  }, async ({ project_id, table_id, filters, limit, offset, sort, columns }) => tableToolResult(
    await queryRows(project_id, table_id, { filters, limit, offset, sort, columns }),
  ));

  server.registerTool('db_count_table_rows', {
    description: 'Сколько строк подходит под те же фильтры, что и db_find_table_rows.',
    inputSchema: { project_id: z.number(), table_id: z.number(), filters: z.array(filterSchema).max(5).optional() },
  }, async ({ project_id, table_id, filters }) => tableToolResult(await countRows(project_id, table_id, filters)));

  server.registerTool('db_get_table_summary', {
    description: 'Число строк и сколько непустых ячеек в каждом столбце.',
    inputSchema: { project_id: z.number(), table_id: z.number() },
  }, async ({ project_id, table_id }) => tableToolResult(await getSummary(project_id, table_id)));
}
