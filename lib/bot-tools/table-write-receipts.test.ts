/** @fileoverview Подтверждения HTTP-записей выдаются только при успешном результате хранилища. */
import { afterEach, expect, it, vi } from 'vitest';
import express from 'express';
import { fetch as nodeFetch } from 'undici';
/** Изолированные ответы хранилища вместо пользовательской БД. */
const state = vi.hoisted(() => ({ missing: false, bundleFails: false, queries: [] as string[] }));
vi.mock('../../server/routes/tables/owned-table', () => ({ ownedTable: async () => ({ projectId: 7, table: { id: 9, name: 'Товары' }, columns: [{ id: 4, name: 'Цена' }] }) }));
vi.mock('../../server/routes/tables/table-db', () => {
  const db = { query: async (sql: string, args: any[] = []) => {
    state.queries.push(sql);
    if (sql.includes('FOR UPDATE')) return { rows: [{ id: 9 }] };
    if (sql.startsWith('SELECT c.id')) return { rows: [{ id: 4, table_id: 9, name: 'Цена', position: 0, settings: {} }] };
    if (sql.startsWith('UPDATE bot_table_rows r')) return { rows: state.missing ? [] : [{ id: 11, table_id: 9, row_index: 0, data: JSON.parse(args[3]) }] };
    return { rows: [] };
  } };
  return { tablePool: db, withClient: async (work: (client: unknown) => unknown) => work(db) };
});
vi.mock('../../server/database/bot-tables/import-bundle', () => ({ importBundleInProject: async (db: any) => {
  await db.query('BEGIN');
  if (state.bundleFails) { await db.query('ROLLBACK'); return { ok: false, status: 409, message: 'Конфликт', failed_table_index: 0 }; }
  await db.query('COMMIT'); return { ok: true, tables: [{ tableId: 9, name: 'Товары', rowCount: 1 }] };
} }));
vi.mock('../../server/database/bot-tables/apply-ops', () => ({ applyTableOps: async (db: any) => {
  await db.query('BEGIN');
  if (state.bundleFails) { await db.query('ROLLBACK'); return { ok: false, status: 409, message: 'Конфликт', failed_op_index: 0 }; }
  await db.query('COMMIT'); return { ok: true, results: [{ op: 'reindex', ok: true }], tableName: 'Товары', contentRows: [] };
} }));
vi.mock('../../server/routes/tables/notify-table-change', () => ({ notifyTableChange: vi.fn() }));
import { patchRowHandler } from '../../server/routes/tables/handlers/patchRowHandler';
import { importBundleHandler } from '../../server/routes/tables/handlers/importBundleHandler';
import { applyOpsHandler } from '../../server/routes/tables/handlers/applyOpsHandler';
afterEach(() => { state.missing = false; state.bundleFails = false; state.queries = []; });
/**
 * Исполняет настоящие HTTP-хендлеры над изолированной границей хранилища.
 * @param run - Проверка HTTP-ответов.
 * @returns Завершение проверки.
 */
async function withApi(run: (base: string) => Promise<void>) {
  const app = express(); app.use(express.json());
  app.patch('/api/projects/:id/tables/:tableId/rows/:rowId', patchRowHandler);
  app.post('/api/projects/:id/tables/import', importBundleHandler);
  app.post('/api/projects/:id/tables/:tableId/apply-ops', applyOpsHandler);
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as { port: number }).port}`); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
it('legacy patch подтверждает RETURNING и не подтверждает отсутствие строки', async () => {
  await withApi(async base => {
    const request = { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { '4': '12' } }) };
    const saved = await nodeFetch(`${base}/api/projects/7/tables/9/rows/11`, request);
    expect(await saved.json()).toMatchObject({ id: 11, data: { '4': '12' }, persistence: { confirmed: true } });
    expect(state.queries.some(sql => sql.includes('RETURNING'))).toBe(true); expect(state.queries.at(-1)).toBe('COMMIT');
    state.missing = true;
    const missing = await nodeFetch(`${base}/api/projects/7/tables/9/rows/11`, request);
    expect(missing.status).toBe(404); expect(await missing.json()).not.toHaveProperty('persistence');
  });
});
it('bundle подтверждает COMMIT результата и не подтверждает rollback/conflict', async () => {
  await withApi(async base => {
    const request = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'create', tables: [{ name: 'Товары', columns: ['Цена'], rows: [['12']] }] }) };
    const saved = await nodeFetch(`${base}/api/projects/7/tables/import`, request);
    expect(saved.status).toBe(201); expect(await saved.json()).toMatchObject({ ok: true, persistence: { confirmed: true, projectId: 7 } });
    expect(state.queries.at(-1)).toBe('COMMIT');
    state.bundleFails = true;
    const failed = await nodeFetch(`${base}/api/projects/7/tables/import`, request);
    expect(failed.status).toBe(409); const body = await failed.json(); expect(body).toHaveProperty('failed_table_index', 0); expect(body).not.toHaveProperty('persistence');
    expect(state.queries.at(-1)).toBe('ROLLBACK');
  });
});
it('HTTP отклоняет повторные нормализованные колонки до записи пакета', async () => {
  await withApi(async base => {
    const response = await nodeFetch(`${base}/api/projects/7/tables/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'create', tables: [{ name: 'Товары', columns: ['A', ' A '], rows: [['первое', 'второе']] }] }) });
    expect(response.status).toBe(400); expect(await response.json()).not.toHaveProperty('persistence'); expect(state.queries).toEqual([]);
  });
});
it('apply-ops подтверждает общий COMMIT и не выдаёт proof для частичной ошибки', async () => {
  await withApi(async base => {
    const request = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops: [{ op: 'reindex' }] }) };
    const saved = await nodeFetch(`${base}/api/projects/7/tables/9/apply-ops`, request);
    expect(await saved.json()).toMatchObject({ results: [{ op: 'reindex' }], persistence: { confirmed: true, projectId: 7, tableId: 9 } });
    expect(state.queries.at(-1)).toBe('COMMIT');
    state.bundleFails = true;
    const failed = await nodeFetch(`${base}/api/projects/7/tables/9/apply-ops`, request);
    expect(failed.status).toBe(409); expect(await failed.json()).not.toHaveProperty('persistence'); expect(failed.headers.get('x-botcraft-persistence')).toBeNull(); expect(state.queries.at(-1)).toBe('ROLLBACK');
  });
});
