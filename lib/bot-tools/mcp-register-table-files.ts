/**
 * @fileoverview Файловые инструменты таблиц: только локальный stdio
 * @module lib/bot-tools/mcp-register-table-files
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exportProjectTables, exportTableFile, importProjectTables, importTableFile } from './bot-tables-files.ts';
import { tableToolResult } from './mcp-table-result.ts';

/**
 * Регистрирует импорт и экспорт файлов
 * @param server - MCP-сервер
 */
export function registerTableFileTools(server: McpServer): void {
  server.registerTool('db_import_table_file', {
    description: 'Импорт CSV или JSON из рабочего каталога или временной папки. Ссылки и чужие пути запрещены. replace требует confirm: true.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      path: z.string(),
      mode: z.enum(['append', 'replace']),
      confirm: z.boolean().optional(),
    },
  }, async ({ project_id, table_id, path, mode, confirm }) => tableToolResult(
    await importTableFile(project_id, table_id, path, mode, confirm),
  ));

  server.registerTool('db_export_table', {
    description: 'Выгрузить таблицу в csv, json или jsonl во временный закрытый каталог. Путь назначает сервер.',
    inputSchema: { project_id: z.number(), table_id: z.number(), format: z.enum(['csv', 'json', 'jsonl']) },
  }, async ({ project_id, table_id, format }) => tableToolResult(await exportTableFile(project_id, table_id, format)));

  server.registerTool('db_export_project_tables', {
    description: 'Выгрузить все пользовательские таблицы в JSON версии 1 или JSONL во временный каталог.',
    inputSchema: { project_id: z.number(), format: z.enum(['json', 'jsonl']) },
  }, async ({ project_id, format }) => tableToolResult(await exportProjectTables(project_id, format)));

  server.registerTool('db_import_project_tables', {
    description: 'Прочитать общий JSON версии 1. Без confirm возвращает только превью. Запись и замена требуют confirm: true.',
    inputSchema: {
      project_id: z.number(),
      path: z.string(),
      mode: z.enum(['create', 'replace']),
      confirm: z.boolean().optional(),
    },
  }, async ({ project_id, path, mode, confirm }) => tableToolResult(
    await importProjectTables(project_id, path, mode, confirm),
  ));
}
