/** @fileoverview Проверки постоянных квитанций бюджета с изолированным хранилищем транзакции. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import { fetch as nodeFetch } from 'undici';
import { createHash } from 'node:crypto';
/** Сохранение расхода заменено только на границе хранилища для проверки повторной доставки. */
const save = vi.hoisted(() => vi.fn());
vi.mock('../../server/routes/analytics/acquisition/link-budget', async importOriginal => {
  const original = await importOriginal<typeof import('../../server/routes/analytics/acquisition/link-budget')>();
  return { ...original, saveLinkBudget: save };
});
import { saveIdempotentLinkBudget } from '../../server/routes/analytics/acquisition/budget-idempotency';
import { linkBudgetInput } from '../../server/routes/analytics/acquisition/link-budget';
import { setupAcquisitionRoutes } from '../../server/routes/analytics/acquisition/routes';
import { requestAnalyticsV2 } from './analytics-v2-api';
beforeEach(() => { save.mockReset(); save.mockResolvedValue({ item: { id: 55, amount: '10.00' } }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
/** Тело одной оплаты. */
const body = { requestId: '313c936b-d07a-40b8-b07f-c3bb17249516', tokenId: 3, marker: 'promo', amount: '10.00', currency: 'RUB', day: '2026-11-01', timezone: 'Europe/Moscow' };
it('возвращает сохранённый ответ, изолирует проекты и отклоняет подмену тела', async () => {
  const persisted = new Map<string, { request_hash: string; response: unknown }>();
  const query = vi.fn(async (sql: string, args: any[]) => {
    const key = `${args[0]}:${args[1]}`;
    if (sql.startsWith('SELECT')) return { rows: persisted.has(key) ? [persisted.get(key)] : [] };
    persisted.set(key, { request_hash: args[2], response: JSON.parse(args[3]) }); return { rows: [] };
  });
  const first = await saveIdempotentLinkBudget({ query } as never, 7, body, 'owner');
  expect(await saveIdempotentLinkBudget({ query } as never, 7, { ...body }, 'owner')).toEqual(first);
  expect(save).toHaveBeenCalledTimes(1);
  await expect(saveIdempotentLinkBudget({ query } as never, 7, { ...body, amount: '20.00' }, 'owner')).rejects.toThrow('requestId');
  await saveIdempotentLinkBudget({ query } as never, 8, body, 'other-owner'); expect(save).toHaveBeenCalledTimes(2);
  const { requestId: _id, ...input } = linkBudgetInput.parse(body);
  expect(persisted.get(`7:${body.requestId}`)?.request_hash).toBe(createHash('sha256').update(JSON.stringify(input, Object.keys(input).sort())).digest('hex'));
});
it('не записывает квитанцию при ошибке расхода, оставляя rollback вызывающей транзакции', async () => {
  save.mockRejectedValue(new Error('Откат расхода'));
  const query = vi.fn(async () => ({ rows: [] }));
  await expect(saveIdempotentLinkBudget({ query } as never, 7, body, null)).rejects.toThrow('Откат');
  expect(query).toHaveBeenCalledTimes(1);
});
it('HTTP проверяет доступ до соединения, коммитит квитанцию и откатывает отказ', async () => {
  let denied = false; let failReceipt = false;
  const persisted = new Map<string, unknown>(); const sql: string[] = [];
  const query = vi.fn(async (text: string, args: any[] = []) => {
    sql.push(text);
    if (text.startsWith('SELECT request_hash')) return { rows: persisted.has(args[1]) ? [persisted.get(args[1])] : [] };
    if (text.startsWith('INSERT INTO analytics_budget_requests')) {
      if (failReceipt) throw new Error('Секрет SQL');
      persisted.set(args[1], { request_hash: args[2], response: JSON.parse(args[3]) });
    }
    return { rows: [] };
  });
  const connect = vi.fn(async () => ({ query, release: vi.fn() }));
  const app = express(); app.use(express.json());
  setupAcquisitionRoutes(app, { connect } as never, (_req, res, next) => { if (denied) res.status(403).json({ message: 'Нет доступа' }); else next(); });
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  vi.stubEnv('API_BASE_URL', `http://127.0.0.1:${(server.address() as { port: number }).port}`); vi.stubGlobal('fetch', nodeFetch);
  try {
    const request = { projectId: 7, endpoint: 'acquisition/budgets', method: 'POST' as const, body };
    denied = true; expect(await requestAnalyticsV2(request)).toHaveProperty('status', 403); expect(connect).not.toHaveBeenCalled();
    denied = false;
    const saved = await requestAnalyticsV2(request); expect(saved).toMatchObject({ item: { id: 55 }, persistence: { confirmed: true, projectId: 7 } }); expect(sql.at(-1)).toBe('COMMIT');
    await requestAnalyticsV2(request); expect(save).toHaveBeenCalledTimes(1);
    failReceipt = true;
    const failed = await requestAnalyticsV2({ ...request, body: { ...body, requestId: '413c936b-d07a-40b8-b07f-c3bb17249516' } });
    expect(failed).toHaveProperty('status', 503); expect(JSON.stringify(failed)).not.toContain('Секрет SQL'); expect(sql.at(-1)).toBe('ROLLBACK');
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
