/**
 * @fileoverview Создание проекта с постоянной заявкой проверяется без реальной БД.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rows: new Map<string, any>(), create: vi.fn(), checkpointFailure: false }));
vi.mock('../../server/services/action-requests/default-ledger', () => ({ actionRequestLedger: {
 claim: async (key: any, hash: string) => { const id = JSON.stringify(key); const prior = mocks.rows.get(id); if (prior) return { acquired: false, record: prior }; mocks.rows.set(id, { request_hash: hash, state: 'pending' }); return { acquired: true }; },
 complete: async (key: any, status: number, receipt: unknown) => { Object.assign(mocks.rows.get(JSON.stringify(key)), { state: 'completed', status, receipt }); },
 checkpoint: async (key: any, receipt: unknown) => { if (mocks.checkpointFailure) throw new Error('ledger offline'); Object.assign(mocks.rows.get(JSON.stringify(key)), { receipt }); },
 unknown: async (key: any) => { mocks.rows.get(JSON.stringify(key)).state = 'unknown'; },
} }));
vi.mock('../../server/storages/storage', () => ({ storage: { createBotProject: mocks.create } }));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 1 }));
vi.mock('../../server/services/content-table', () => ({ ensureContentTable: vi.fn() }));
vi.mock('../../server/terminal/broadcastProjectsChanged', () => ({ broadcastProjectsChanged: vi.fn() }));
import { createProjectHandler } from '../../server/routes/projectRoutes/handlers/createProjectHandler';
/** Создаёт изолированный ответ Express с захватом отложенного JSON. */
function invocation(name = 'Новый') {
 const req = { params: {}, query: {}, body: { name, data: {}, requestId: 'cae87b13-0ce8-4780-b9f8-3543d398dfb0' } };
 const res: any = { locals: {}, statusCode: 200, headersSent: false, json: vi.fn(), status(code: number) { this.statusCode = code; return this; } };
 return { req: req as never, res };
}
describe('постоянная заявка создания проекта', () => {
 beforeEach(() => { mocks.rows.clear(); mocks.create.mockReset().mockResolvedValue({ id: 8, name: 'Новый', revision: 0, botToken: 'secret', sessionId: 'private' }); mocks.checkpointFailure = false; });
 it('повтор возвращает ту же безопасную квитанцию без второго INSERT', async () => {
  const first = invocation(); const repeated = invocation(); await createProjectHandler(first.req, first.res); await createProjectHandler(repeated.req, repeated.res);
  expect(mocks.create).toHaveBeenCalledTimes(1); expect(repeated.res.json.mock.calls[0][0]).toMatchObject({ id: 8, persistence: { confirmed: true } });
  expect(JSON.stringify(repeated.res.json.mock.calls[0][0])).not.toContain('secret');
 });
 it('тот же requestId с другим именем отклоняется до записи', async () => {
  const first = invocation(); await createProjectHandler(first.req, first.res);
  const conflict = invocation('Другое'); await createProjectHandler(conflict.req, conflict.res);
  expect(conflict.res.statusCode).toBe(409); expect(mocks.create).toHaveBeenCalledTimes(1);
 });
 it('отклоняет невалидные данные до захвата постоянной заявки', async () => {
  const invalid = invocation(''); await createProjectHandler(invalid.req, invalid.res);
  expect(invalid.res.statusCode).toBe(400); expect(mocks.rows.size).toBe(0); expect(mocks.create).not.toHaveBeenCalled();
 });
 it('не повторяет создание после commit и потери квитанции', async () => {
  mocks.checkpointFailure = true;
  const first = invocation(); await createProjectHandler(first.req, first.res);
  expect(first.res.statusCode).toBe(202);
  const repeated = invocation(); await createProjectHandler(repeated.req, repeated.res);
  expect(repeated.res.statusCode).toBe(202); expect(mocks.create).toHaveBeenCalledTimes(1);
 });
});
