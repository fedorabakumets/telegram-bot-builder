/** @fileoverview Проверки общего union, безопасных ошибок и встроенного переноса таблиц. */
import { afterEach, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTableBundleTools } from './mcp-register-table-bundle-tools';
import { tableRequest } from './bot-tables-http';
import { tableOperationSchema } from '../../shared/table-ops-schema';
import { parseOneOp } from '../../server/database/bot-tables/parse-one-op';
afterEach(() => vi.unstubAllGlobals());
it('применяет один контракт операций в HTTP parser и MCP', () => {
  const operations = [{ op: 'add_column', name: 'Имя' }, { op: 'rename_column', column_id: 2, name: 'Цена' }, { op: 'delete_column', column_id: 2 }, { op: 'add_rows', rows: [{ data: { '2': '1' }, row_index: 0 }] }, { op: 'update_row', row_id: 1, data: {} }, { op: 'patch_row', row_id: 1, data: {} }, { op: 'delete_row', row_id: 1 }, { op: 'reindex' }];
  for (const op of operations) { expect(tableOperationSchema.safeParse(op).success).toBe(true); expect(parseOneOp(op)).not.toHaveProperty('message'); }
  expect(parseOneOp({ op: 'delete_row', row_id: -1 })).toHaveProperty('message');
  expect(tableOperationSchema.safeParse({ op: 'unknown' }).success).toBe(false);
});
it('сохраняет безопасные индексы ошибки, скрывает серверные детали', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ message: 'Конфликт', failed_op_index: 2, secret: 'sql' }, { status: 409 })).mockResolvedValueOnce(Response.json({ message: 'password', failed_op_index: 1 }, { status: 500 })); vi.stubGlobal('fetch', fetch);
  expect(await tableRequest('/api/projects/1/tables/2')).toEqual({ error: 'HTTP 409: Конфликт', status: 409, failed_op_index: 2 });
  expect(await tableRequest('/api/projects/1/tables/2')).toEqual({ error: 'HTTP 500', status: 500 });
});
it('preview не вызывает API, запись использует bundle HTTP, экспорт явно сообщает неполноту', async () => {
  const calls = new Map<string, any>(); registerTableBundleTools({ registerTool: (name: string, _config: unknown, callback: unknown) => calls.set(name, callback) } as unknown as McpServer);
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ok: true, tables: [{ tableId: 9 }] }, { status: 201 })).mockResolvedValueOnce(Response.json({ table: { name: 'Товары' }, columns: [{ id: 4, name: 'Цена', settings: { dataType: 'number' } }] })).mockResolvedValueOnce(Response.json({ rows: [{ data: { '4': '10' } }], total: 2 })); vi.stubGlobal('fetch', fetch);
  const args = { project_id: 7, bundle: { version: 1, tables: [{ name: 'Товары', columns: ['Цена'], rows: [['10']] }] }, mode: 'create' };
  const preview = await calls.get('db_import_tables_data')(args); expect(JSON.parse(preview.content[0].text).saved).toBe(false); expect(fetch).not.toHaveBeenCalled();
  await calls.get('db_import_tables_data')({ ...args, confirm: true });
  expect(String(fetch.mock.calls[0][0])).toContain('/api/projects/7/tables/import'); expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toMatchObject({ mode: 'create', confirm: true, tables: args.bundle.tables });
  const exported = JSON.parse((await calls.get('db_export_table_data')({ project_id: 7, table_id: 9, limit: 1 })).content[0].text);
  expect(exported).toMatchObject({ complete: false, next_offset: 1, total: 2 }); expect(exported.tables[0].rows).toEqual([['10']]);
});
