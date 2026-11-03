/** @fileoverview Проверка реальной durable-обёртки через MCP HTTP адаптер шаблонов. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { durableAction } from '../../server/services/action-requests/durable-action';
import { externalActionReceipt } from '../../server/routes/durable-project-action';
import { templatesRequest } from './templates-db';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('./api-fetch', () => ({ apiFetch: mocks.fetch }));
vi.mock('../../server/services/action-requests/default-ledger', () => ({ actionRequestLedger: {} }));
/** Проводит запрос через настоящую обёртку и сериализацию HTTP. */
async function invoke(wrapper: any, body: unknown) {
  let value: unknown;
  const res: any = { locals: {}, statusCode: 200, headersSent: false,
    status(code: number) { this.statusCode = code; return this; },
    json(item: unknown) { value = item; return this; } };
  await wrapper({ params: { id: '1' }, query: {}, body }, res, vi.fn());
  return new Response(JSON.stringify(value), { status: res.statusCode });
}
beforeEach(() => vi.resetAllMocks());
describe('Durable шаблон через MCP адаптер', () => {
  it('понимает allowlisted IDs первой квитанции и replay без повторного создания', async () => {
    let record: any;
    let created = 0;
    const ledger = {
      claim: vi.fn(async (_key, hash) => record ? { acquired: false, record } : (record = { request_hash: hash, state: 'pending' }, { acquired: true })),
      complete: vi.fn(async (_key, status, receipt) => { Object.assign(record, { state: 'completed', status, receipt }); }),
      unknown: vi.fn(), checkpoint: vi.fn(),
    };
    const wrapper = durableAction(async (_req, res) => { created++; res.status(201).json({ project: { id: 5, token: 'secret' }, copiedTemplate: { id: 6, data: { private: true } } }); }, { action: 'use_template', scope: () => 'owner:1:template:1', ledger: ledger as never, receipt: externalActionReceipt });
    mocks.fetch.mockImplementation(async (path, init) => {
      if (path === '/api/templates/1/use') return invoke(wrapper, JSON.parse(init.body));
      if (path === '/api/templates/6') return new Response(JSON.stringify({ id: 6 }));
      if (path === '/api/projects/5') return new Response(JSON.stringify({ id: 5 }));
      throw new Error('Неожиданный маршрут');
    });
    const body = { requestId: '11111111-1111-4111-8111-111111111111' };
    const first = await templatesRequest('POST', 1, body, true);
    const replay = await templatesRequest('POST', 1, body, true);
    expect(first).toMatchObject({ projectId: 5, templateId: 6, persistence: { confirmed: true } });
    expect(replay).toMatchObject({ projectId: 5, templateId: 6, persistence: { confirmed: true } });
    expect(created).toBe(1);
    expect(JSON.stringify([first, replay, record.receipt])).not.toContain('secret');
  });
  it('сохраняет partial receipt неизвестного исхода и не пытается создавать снова', async () => {
    const handler = vi.fn();
    const ledger = { claim: vi.fn(async (_key, hash) => ({ acquired: false, record: { request_hash: hash, state: 'unknown', receipt: { projectId: 5 } } })) };
    const wrapper = durableAction(handler, { action: 'use_template', scope: () => 'owner:1:template:1', ledger: ledger as never, receipt: externalActionReceipt });
    mocks.fetch.mockImplementation(async (_path, init) => invoke(wrapper, JSON.parse(init.body)));
    const value = await templatesRequest('POST', 1, { requestId: '11111111-1111-4111-8111-111111111111' }, true);
    expect(value).toMatchObject({ outcome: 'unknown', receipt: { projectId: 5 }, retryable: false });
    expect(handler).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
