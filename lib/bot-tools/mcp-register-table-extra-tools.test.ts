/** @fileoverview Проверки новых MCP-записей через HTTP, реальные хендлеры и изолированное состояние. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { fetch as nodeFetch } from 'undici';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTableExtraTools } from './mcp-register-table-extra-tools';
/** Изолированное состояние вместо рабочей БД. */
const state = vi.hoisted(() => ({ settings: {}, deny: false, writes: 0, queries: [] as string[], data: { '4': 'старое' } }));
vi.mock('../../server/routes/tables/owned-table', () => ({ ownedTable: async (_req: unknown, res: express.Response) => {
  if (state.deny) { res.status(403).json({ message: 'Нет доступа' }); return null; }
  return { projectId: 7, table: { id: 9, name: 'Товары' }, columns: [{ id: 4, name: 'Описание' }] };
} }));
vi.mock('../../server/routes/tables/table-db', () => ({ withClient: async (work: (db: unknown) => unknown) => work({ query: async (sql: string, args: unknown[]) => {
  state.queries.push(sql);
  if (sql.startsWith('SELECT data FROM bot_projects')) return { rows: [{ data: { sheets: [] } }] };
  if (sql.startsWith('SELECT name FROM bot_tables')) return { rows: [{ name: 'Товары' }] };
  if (sql.startsWith('SELECT id, name, settings')) return { rows: [{ id: 4, name: 'Описание', settings: {} }] };
  if (sql.startsWith('SELECT id, table_id')) return { rows: [{ id: 11, table_id: 9, row_index: 0, data: { ...state.data } }] };
  if (sql.startsWith('UPDATE bot_table_rows')) { state.data = JSON.parse(String(args[1])); state.writes++; return { rows: [] }; }
  if (sql.startsWith('UPDATE')) { state.settings = JSON.parse(String(args[2])); state.writes++; return { rows: [{ id: 4 }] }; }
  return { rows: [] };
} }), tablePool: {} }));
vi.mock('../../server/routes/tables/notify-table-change', () => ({ notifyTableChange: vi.fn() }));
import { columnSettingsHandler } from '../../server/routes/tables/handlers/columnSettingsHandler';
import { editCellsHandler } from '../../server/routes/tables/handlers/editCellsHandler';
import { patchRowHandler } from '../../server/routes/tables/handlers/patchRowHandler';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); state.deny = false; state.writes = 0; state.settings = {}; state.queries = []; state.data = { '4': 'старое' }; });
/**
 * Пропускает вызов MCP через настоящий HTTP до хендлера.
 * @param run - Проверка зарегистрированных обработчиков.
 * @returns Завершение проверки.
 */
async function withApi(run: (calls: Map<string, (args: any) => Promise<any>>) => Promise<void>) {
  vi.stubGlobal('fetch', nodeFetch);
  const calls = new Map<string, (args: any) => Promise<any>>();
  registerTableExtraTools({ registerTool: (name: string, _config: unknown, callback: any) => calls.set(name, callback) } as unknown as McpServer);
  const app = express(); app.use(express.json());
  app.put('/api/projects/:id/tables/:tableId/columns/:columnId/settings', columnSettingsHandler);
  app.post('/api/projects/:id/tables/:tableId/cells/edit', editCellsHandler);
  app.patch('/api/projects/:id/tables/:tableId/rows/:rowId', patchRowHandler);
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  vi.stubEnv('API_BASE_URL', `http://127.0.0.1:${(server.address() as { port: number }).port}`);
  try { await run(calls); } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
describe('Настройки таблиц MCP → HTTP → сохранение', () => {
  it('сохраняет настройки в хендлере и отвечает после COMMIT', async () => {
    await withApi(async calls => {
      const result = await calls.get('db_set_table_column_settings')!({ project_id: 7, table_id: 9, column_id: 4, data: { dataType: 'number', min: 0, required: true } });
      expect(result.isError).not.toBe(true);
      expect(state.settings).toMatchObject({ dataType: 'number', min: 0, required: true });
      expect(state.writes).toBe(1); expect(state.queries[state.queries.length - 1]).toBe('COMMIT');
      expect(JSON.parse(result.content[0].text).settings).toEqual(state.settings);
      expect(JSON.parse(result.content[0].text).persistence).toEqual({ confirmed: true, projectId: 7, tableId: 9 });
    });
  });
  it('не записывает при отказе доступа или серверной проверке ограничений', async () => {
    await withApi(async calls => {
      state.deny = true;
      expect((await calls.get('db_set_table_column_settings')!({ project_id: 7, table_id: 9, column_id: 4, data: {} })).isError).toBe(true);
      state.deny = false;
      expect((await calls.get('db_set_table_column_settings')!({ project_id: 7, table_id: 9, column_id: 4, data: { min: 10, max: 1 } })).isError).toBe(true);
      expect(state.writes).toBe(0); expect(state.queries).toEqual([]);
    });
  });
  it('сохраняет условные ячейки реальным обработчиком и отклоняет устаревший повтор', async () => {
    await withApi(async calls => {
      const args = { project_id: 7, table_id: 9, edits: [{ rowId: 11, columnId: '4', before: 'старое', after: 'новое' }] };
      const saved = await calls.get('db_edit_table_cells')!(args);
      expect(saved.isError).not.toBe(true); expect(state.data['4']).toBe('новое');
      expect(JSON.parse(saved.content[0].text).rows[0].data['4']).toBe('новое');
      expect(JSON.parse(saved.content[0].text).persistence.confirmed).toBe(true);
      expect(state.queries[state.queries.length - 1]).toBe('COMMIT');
      const conflict = await calls.get('db_edit_table_cells')!(args);
      expect(conflict.isError).toBe(true); expect(conflict.content[0].text).toContain('409');
      expect(state.writes).toBe(1); expect(state.queries[state.queries.length - 1]).toBe('ROLLBACK');
    });
  });
  it('conditional patch подтверждает COMMIT и не выдаёт квитанцию при конфликте', async () => {
    await withApi(async calls => {
      const args = { project_id: 7, table_id: 9, row_id: 11, data: { '4': 'новое' }, expected: { '4': 'старое' } };
      const saved = await calls.get('db_patch_table_row_expected')!(args);
      expect(saved.isError).not.toBe(true); expect(JSON.parse(saved.content[0].text)).toMatchObject({ data: { '4': 'новое' }, persistence: { confirmed: true } });
      expect(state.queries[state.queries.length - 1]).toBe('COMMIT');
      const conflict = await calls.get('db_patch_table_row_expected')!(args);
      expect(conflict.isError).toBe(true); expect(JSON.parse(conflict.content[0].text)).not.toHaveProperty('persistence'); expect(state.queries[state.queries.length - 1]).toBe('ROLLBACK');
    });
  });
});
