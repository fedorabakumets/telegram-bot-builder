/** @fileoverview Настоящие SQL и HTTP проверки рекламы, точных денег и изоляции проектов. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createAnalyticsTestDatabase } from '../v2/test-database';
import { setupAcquisitionRoutes } from './routes';
import { acquisitionReport } from './report';
/** Изолированная схема PostgreSQL и отдельный HTTP-сервер теста. */
const db = createAnalyticsTestDatabase();
let server: Server, url: string, sourceId: number, placementId: number, link: Record<string, any>;
/** Выполняет HTTP-запрос штатного API без браузерного mock fetch. */
async function request(path: string, body?: unknown, method = body ? 'POST' : 'GET', project = 1) {
  const response = await fetch(`${url}/api/projects/${project}/analytics/acquisition${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() as Record<string, any> };
}
beforeAll(async () => {
  await db.setup();
  await db.pool.query('SELECT mark_analytics_runtime_v2(1,11)');
  await db.pool.query('SELECT mark_analytics_runtime_v2(1,12)');
  await db.pool.query("UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01T00:00:00Z'");
  const app = express(); app.use(express.json());
  setupAcquisitionRoutes(app, db.pool, (req, res, next) => {
    if (req.params.id !== '1') { res.status(403).json({ message: 'Нет доступа' }); return; }
    next();
  });
  server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}, 30000);
afterAll(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); await db.cleanup(); });
describe.sequential('Связанные рекламные данные', () => {
  it('создаёт площадку, размещение и постоянную ссылку, запрещает чужого бота', async () => {
    const source = await request('/sources', { name: 'Канал', kind: 'telegram' });
    expect(source.status).toBe(201); sourceId = source.data.item.id;
    expect((await request('/placements', { name: 'Чужой', tokenId: 21, sourceId })).status).toBe(403);
    const placement = await request('/placements', { name: 'Публикация', tokenId: 11, sourceId, timezone: 'Europe/Moscow' });
    expect(placement.status).toBe(201); placementId = placement.data.item.id;
    link = (await request('/links', { placementId })).data.item;
    expect(link.url).toMatch(/^https:\/\/t.me\/first_bot\?start=bc_/);
    const resolved = await db.pool.query('SELECT analytics_resolve_link_v2(1,11,$1) value', [link.code]);
    expect(resolved.rows[0].value.placement_id).toBe(placementId);
    expect((await request('/sources', undefined, 'GET', 2)).status).toBe(403);
    /** Бюджет наследует те же права проекта и проверку принадлежности бота. */
    const budget={tokenId:21,marker:'foreign_budget',amount:'1.00',currency:'RUB',day:'2026-10-20',timezone:'Europe/Moscow'};
    expect((await request('/budgets',budget)).status).toBe(403);
    expect((await request('/budgets',{...budget,tokenId:11},'POST',2)).status).toBe(403);
  });
  it('показывает 3000 рублей / 200 новых = 15 рублей и отдельно повторные запуски', async () => {
    await db.pool.query(`SELECT record_analytics_event_v2(jsonb_build_object('project_id',1,'token_id',11,
      'event_key','msg:'||n||':1','kind','message_in','user_id',n::text,'chat_id',n::text,'chat_type','private',
      'directed',true,'occurred_at','2026-10-20T12:00:00Z','source_id',$1::int,'placement_id',$2::int,
      'link_id',$3::int,'attribution_status','resolved','metadata',jsonb_build_object('entry',true))) FROM generate_series(1000,1199) n`, [sourceId,placementId,link.id]);
    await db.record({ user_id: '1000', event_key: 'msg:1000:2', source_id: sourceId, placement_id: placementId, link_id: link.id, metadata: { entry: true }, occurred_at: '2026-10-20T13:00:00Z' });
    const expense = await request('/expenses', { placementId, amount: '3000.00', currency: 'RUB', day: '2026-10-20' });
    expect(expense.status).toBe(201);
    const client = await db.pool.connect();
    try { await acquisitionReport(client, 1, { from: '2026-10-19T21:00:00Z', to: '2026-10-20T21:00:00Z' }); }
    finally { client.release(); }
    const { data } = await request('/report?from=2026-10-19T21:00:00Z&to=2026-10-20T21:00:00Z');
    /** Повторный запуск нового человека внутри окна не делает его вернувшимся из прошлого периода. */
    expect(data.rows[0]).toMatchObject({ newUsers: 200, returningUsers: 0, repeatStarts: 1, spend: { RUB: '3000.00', USD: null }, costPerUser: '15.00' });
    const partial = await request('/report?from=2026-10-20T10:00:00Z&to=2026-10-20T18:00:00Z');
    expect(partial.data.rows[0].costPerUser).toBeNull();
    expect(partial.data.rows[0].reason).toContain('календарные дни');
  });
  it('не складывает валюты без курса, сохраняет дату курса и историю исправлений', async () => {
    const created = await request('/expenses', { placementId, amount: '10.00', currency: 'USD', day: '2026-10-20' });
    const id = created.data.items[0].id;
    const without = await request('/report');
    expect(without.data.rows[0]).toMatchObject({ spend: { RUB: '3000.00', USD: '10.00' }, convertedSpend: null, costPerUser: null });
    expect(without.data.rows[0].costPerUserByCurrency).toEqual({ RUB: '15.00', USD: '0.05' });
    expect((await request(`/expenses/${id}`, { exchangeRateRubPerUsd: '90', exchangeRateDate: '2026-10-19' }, 'PATCH')).status).toBe(200);
    const withRate = await request('/report');
    expect(withRate.data.rows[0]).toMatchObject({ convertedSpend: '3900.00', costPerUser: '19.50' });
    const history = await request(`/expenses/${id}/history`);
    expect(history.data.items).toHaveLength(2);
    expect(history.data.items[0].beforeData.exchange_rate_rub_per_usd).toBeNull();
  });
  it('не выдаёт проектную цену за точную, если другой бот ещё не обновлён', async () => {
    await db.pool.query('DELETE FROM analytics_runtime_v2 WHERE project_id=1 AND token_id=12');
    const project = await request('/report');
    expect(project.data.rows[0].costPerUserByCurrency).toEqual({ RUB: null, USD: null });
    expect(project.data.rows[0].reason).toContain('неполная');
    const bot = await request('/report?tokenId=11');
    expect(bot.data.rows[0].costPerUser).toBe('19.50');
    await db.pool.query('SELECT mark_analytics_runtime_v2(1,12)');
    await db.pool.query("UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01T00:00:00Z' WHERE token_id=12");
  });
  it('изменение ссылки не держит её блокировку, пока ждёт общую версию проекта', async () => {
    const writer = await db.pool.connect();
    try {
      await writer.query('BEGIN');
      await writer.query("SET LOCAL statement_timeout='2000ms'");
      await writer.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1 FOR UPDATE');
      const patch = request(`/links/${link.id}`, { archived: false }, 'PATCH');
      await new Promise(resolve => setTimeout(resolve, 150));
      await writer.query('UPDATE analytics_links SET archived_at=NULL WHERE id=$1', [link.id]);
      await writer.query('COMMIT');
      expect((await patch).status).toBe(200);
    } finally { await writer.query('ROLLBACK'); writer.release(); }
  });
  it('переименование и архивирование не меняют опубликованный код', async () => {
    await request(`/placements/${placementId}`, { name: 'Новое название', archived: true }, 'PATCH');
    const resolved = await db.pool.query('SELECT analytics_resolve_link_v2(1,11,$1) value', [link.code]);
    expect(resolved.rows[0].value.placement_id).toBe(placementId);
    const secret = await db.pool.query("SELECT analytics_resolve_link_v2(1,11,'link_secret') value");
    expect(JSON.stringify(secret.rows[0].value)).not.toContain('secret');
    const unverified = await db.pool.query("SELECT analytics_resolve_link_v2(1,11,'ref_1000') value");
    expect(unverified.rows[0].value).toMatchObject({ attribution_status: 'referral_unknown' });
    expect(unverified.rows[0].value.referrer_id).toBeUndefined();
    expect((await request('/links', { placementId })).status).toBe(400);
  });
  it('две одновременные оплаты используют один источник без потери бюджета',async()=>{
    const body={tokenId:11,marker:'concurrent_budget',amount:'10.00',currency:'RUB',day:'2026-10-20',timezone:'Europe/Moscow'};
    const results=await Promise.all([request('/budgets',body),request('/budgets',body)]);
    expect(results.map(result=>result.status)).toEqual([201,201]);
    const {rows:[counts]}=await db.pool.query(`SELECT count(DISTINCT l.id)::int links,count(DISTINCT l.placement_id)::int placements,
      count(e.id)::int expenses,sum(e.amount)::text amount FROM analytics_links l JOIN analytics_expenses e ON e.placement_id=l.placement_id
      WHERE l.project_id=1 AND l.token_id=11 AND l.code='concurrent_budget'`);
    expect(counts).toEqual({links:1,placements:1,expenses:2,amount:'20.00'});
  });
});
