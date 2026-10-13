/**
 * @fileoverview MCP-инструменты изменения пользовательских таблиц
 * @module lib/bot-tools/mcp-register-table-write
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { applyTableOps } from './bot-tables-batch.ts';
import {
  addColumn,
  addRows,
  clearRows,
  createTable,
  deleteColumn,
  deleteRow,
  deleteTable,
  importRows,
  patchRow,
  reindexRows,
  renameColumn,
  renameTable,
  reorderColumns,
  updateRow,
} from './bot-tables-write.ts';
import { tableToolResult } from './mcp-table-result.ts';

const cells = z.record(z.string(), z.string()).describe('Ключ — числовой id столбца строкой, значение — текст, пустая строка допустима');

/**
 * Регистрирует инструменты изменения
 * @param server - MCP-сервер
 */
export function registerTableWriteTools(server: McpServer): void {
  server.registerTool('db_create_table', {
    description: 'Создать пользовательскую таблицу. Имя _content зарезервировано.',
    inputSchema: { project_id: z.number(), name: z.string() },
  }, async ({ project_id, name }) => tableToolResult(await createTable(project_id, name)));

  server.registerTool('db_rename_table', {
    description: 'Переименовать таблицу. Служебную _content переименовать нельзя.',
    inputSchema: { project_id: z.number(), table_id: z.number(), name: z.string() },
  }, async ({ project_id, table_id, name }) => tableToolResult(await renameTable(project_id, table_id, name)));

  server.registerTool('db_delete_table', {
    description: 'Удалить таблицу. Нужен confirm: true, иначе запрос не отправляется. _content удалить нельзя.',
    inputSchema: { project_id: z.number(), table_id: z.number(), confirm: z.boolean() },
  }, async ({ project_id, table_id, confirm }) => tableToolResult(await deleteTable(project_id, table_id, { confirm })));

  server.registerTool('db_add_table_column', {
    description: 'Добавить столбец.',
    inputSchema: { project_id: z.number(), table_id: z.number(), name: z.string(), position: z.number().int().optional() },
  }, async ({ project_id, table_id, name, position }) => tableToolResult(await addColumn(project_id, table_id, name, position)));

  server.registerTool('db_rename_table_column', {
    description: 'Переименовать столбец.',
    inputSchema: { project_id: z.number(), table_id: z.number(), column_id: z.number(), name: z.string() },
  }, async ({ project_id, table_id, column_id, name }) => tableToolResult(await renameColumn(project_id, table_id, column_id, name)));

  server.registerTool('db_delete_table_column', {
    description: 'Удалить столбец. Нужен confirm: true, иначе запрос не отправляется.',
    inputSchema: { project_id: z.number(), table_id: z.number(), column_id: z.number(), confirm: z.boolean() },
  }, async ({ project_id, table_id, column_id, confirm }) => tableToolResult(await deleteColumn(project_id, table_id, column_id, { confirm })));

  server.registerTool('db_reorder_table_columns', {
    description: 'Задать полный порядок столбцов массивом их id.',
    inputSchema: { project_id: z.number(), table_id: z.number(), column_ids: z.array(z.number()) },
  }, async ({ project_id, table_id, column_ids }) => tableToolResult(await reorderColumns(project_id, table_id, column_ids)));

  server.registerTool('db_add_table_rows', {
    description: 'Добавить до 200 строк. Ключи data — id столбцов. Чужой ключ отклоняется до записи.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      rows: z.array(z.object({ row_index: z.number().int().optional(), data: cells })).max(200),
    },
  }, async ({ project_id, table_id, rows }) => tableToolResult(await addRows(project_id, table_id, rows)));

  server.registerTool('db_update_table_row', {
    description: 'Полностью заменить ячейки строки.',
    inputSchema: { project_id: z.number(), table_id: z.number(), row_id: z.number(), data: cells },
  }, async ({ project_id, table_id, row_id, data }) => tableToolResult(await updateRow(project_id, table_id, row_id, data)));

  server.registerTool('db_patch_table_row', {
    description: 'Изменить только переданные ячейки. Пустая строка сохраняется.',
    inputSchema: { project_id: z.number(), table_id: z.number(), row_id: z.number(), data: cells },
  }, async ({ project_id, table_id, row_id, data }) => tableToolResult(await patchRow(project_id, table_id, row_id, data)));

  server.registerTool('db_delete_table_row', {
    description: 'Удалить строку. Нужен confirm: true, иначе запрос не отправляется.',
    inputSchema: { project_id: z.number(), table_id: z.number(), row_id: z.number(), confirm: z.boolean() },
  }, async ({ project_id, table_id, row_id, confirm }) => tableToolResult(await deleteRow(project_id, table_id, row_id, { confirm })));

  server.registerTool('db_reindex_table_rows', {
    description: 'Перенумеровать строки с нуля.',
    inputSchema: { project_id: z.number(), table_id: z.number() },
  }, async ({ project_id, table_id }) => tableToolResult(await reindexRows(project_id, table_id)));

  server.registerTool('db_clear_table_rows', {
    description: 'Удалить все строки таблицы. Нужен confirm: true, иначе запрос не отправляется.',
    inputSchema: { project_id: z.number(), table_id: z.number(), confirm: z.boolean() },
  }, async ({ project_id, table_id, confirm }) => tableToolResult(await clearRows(project_id, table_id, { confirm })));

  server.registerTool('db_import_table_rows', {
    description: 'Импорт до 200 строк. mode append или replace. replace требует confirm: true до обращения к API.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      mode: z.enum(['append', 'replace']),
      confirm: z.boolean().optional(),
      rows: z.array(cells).max(200),
    },
  }, async ({ project_id, table_id, mode, confirm, rows }) => tableToolResult(
    await importRows(project_id, table_id, mode, rows, { confirm }),
  ));

  server.registerTool('db_apply_table_ops', {
    description: 'До 50 операций одной транзакцией: столбцы, строки, переиндексация. Если есть удаление, нужен confirm: true. При ошибке всё откатывается, в ответе failed_op_index.',
    inputSchema: {
      project_id: z.number(),
      table_id: z.number(),
      confirm: z.boolean().optional(),
      ops: z.array(z.record(z.string(), z.unknown())).max(50),
    },
  }, async ({ project_id, table_id, confirm, ops }) => tableToolResult(
    await applyTableOps(project_id, table_id, ops as Array<Record<string, unknown> & { op: string }>, confirm),
  ));
}
