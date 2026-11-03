/** @fileoverview Квитанции таблиц: неизменность старых массивов, безопасные повторы и неопределённый исход. */
import { afterEach, expect, it, vi } from 'vitest';
import express from 'express';
import { fetch as nodeFetch } from 'undici';
import { durableTableWrite } from '../../server/routes/tables/durable-table-write';
import { tableWriteReceipt } from '../../server/routes/tables/write-receipt';
import { tableRequest } from './bot-tables-http';
import { tableToolResult } from './mcp-table-result';
import { readTablePersistenceProof } from './table-persistence-proof';
import { createRowsLocked } from '../../server/routes/tables/locked-create-rows';
/** Результат проверки принадлежности таблицы. */
const access = vi.hoisted(() => ({ denied: false }));
vi.mock('../../server/routes/tables/owned-table', () => ({ ownedTable: async (_req: unknown, res: express.Response) => { if (access.denied) { res.status(403).json({ message: 'Нет доступа' }); return null; } return { projectId: 7 }; } }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); access.denied = false; });
/**
 * Выполняет проверки над локальным маршрутом без рабочей БД.
 * @param run - Набор запросов к обработчику.
 * @returns Завершение проверки.
 */
async function withApi(run: (base: string, state: any) => Promise<void>) {
  const state = { writes: 0, failComplete: false, records: new Map<string, any>(), claims: 0 };
  const ledger = {
    claim: async (key: any, hash: string) => { state.claims++; const record = state.records.get(key.requestId); if (record) return { acquired: false, record }; state.records.set(key.requestId, { request_hash: hash, state: 'pending' }); return { acquired: true }; },
    complete: async (key: any, status: number, receipt: unknown) => { if (state.failComplete) throw new Error('ledger unavailable'); Object.assign(state.records.get(key.requestId), { status, receipt, state: 'completed' }); },
    unknown: async (key: any) => { state.records.get(key.requestId).state = 'unknown'; },
  };
  const app = express(); app.use(express.json());
  app.post('/api/projects/:id/tables/:tableId/rows', durableTableWrite('createRows', async (_req, res) => {
    state.writes++; res.status(201).json(tableWriteReceipt(res, [{ id: 11, data: { secret: 'не сохранять в журнал' } }], 7, 9));
  }, ledger as never));
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try { await run(base, state); } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
it('сохраняет legacy массив и передаёт проверенное доказательство через Symbol в MCP', async () => {
  await withApi(async (base) => {
    vi.stubEnv('API_BASE_URL', base); vi.stubGlobal('fetch', nodeFetch);
    const data = await tableRequest('/api/projects/7/tables/9/rows', { method: 'POST' });
    expect(Array.isArray(data)).toBe(true); expect(JSON.stringify(data)).toContain('secret');
    const result = tableToolResult(data); expect(result._meta?.persistenceProof).toEqual({ confirmed: true, projectId: 7, tableId: 9 });
    expect(JSON.parse(result.content[0].text)).toEqual(data);
  });
});
it('повторяет только безопасную квитанцию ID и не исполняет unknown/подмену аргументов', async () => {
  await withApi(async (base, state) => {
    const body = { requestId: '313c936b-d07a-40b8-b07f-c3bb17249516', rows: [{ data: {} }] };
    const send = (value: unknown) => nodeFetch(`${base}/api/projects/7/tables/9/rows`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    const first = await send(body); const receipt = await first.json();
    expect(receipt).toMatchObject({ state: 'completed', receipt: { ids: [11] }, persistence: { confirmed: true } }); expect(JSON.stringify(receipt)).not.toContain('secret');
    expect(await (await send(body)).json()).toEqual(receipt); expect(state.writes).toBe(1);
    expect((await send({ ...body, rows: [] })).status).toBe(409); expect(state.writes).toBe(1);
    state.failComplete = true; const unknownBody = { ...body, requestId: '413c936b-d07a-40b8-b07f-c3bb17249516' };
    const unknown = await send(unknownBody); expect(unknown.status).toBe(202); expect(unknown.headers.get('x-botcraft-persistence')).toBe(null); expect(await unknown.json()).toHaveProperty('state', 'unknown');
    await send(unknownBody); expect(state.writes).toBe(2);
    const claims = state.claims; access.denied = true; expect((await send(body)).status).toBe(403); expect(state.claims).toBe(claims);
  });
});
it('не принимает доказательство другого проекта/таблицы или ошибочного HTTP', () => {
  const response = (proof: unknown, status = 200) => new Response('[]', { status, headers: { 'x-botcraft-persistence': JSON.stringify(proof) } });
  expect(readTablePersistenceProof(response({ confirmed: true, projectId: 8, tableId: 9 }), '/api/projects/7/tables/9/rows')).toBeUndefined();
  expect(readTablePersistenceProof(response({ confirmed: true, projectId: 7, tableId: 10 }), '/api/projects/7/tables/9/rows')).toBeUndefined();
  expect(readTablePersistenceProof(response({ confirmed: true, projectId: 7, tableId: 9 }, 409), '/api/projects/7/tables/9/rows')).toBeUndefined();
});
it('добавление строк откатывает неполный RETURNING и проверяет настройки после lock', async () => {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('FOR UPDATE')) return { rows: [{ id: 9 }] };
    if (sql.startsWith('SELECT c.id')) return { rows: [{ id: 4, table_id: 9, name: 'Цена', position: 0, settings: { dataType: 'number' } }] };
    if (sql.startsWith('INSERT')) return { rows: [{ id: 11, table_id: 9, row_index: 0, data: { '4': '1' } }] };
    return { rows: [] };
  });
  const result = await createRowsLocked({ query } as never, 7, 9, [{ data: { '4': '1' } }, { data: { '4': '2' } }]);
  expect(result).toHaveProperty('status', 409); expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  query.mockClear();
  expect(await createRowsLocked({ query } as never, 7, 9, [{ data: { '4': 'не число' } }])).toHaveProperty('status', 400);
  expect(query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(false);
});
