/** @fileoverview Реальное совпадение HTTP и MCP снимков PostgreSQL, денег, границ и отказов доступа. */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express, { type RequestHandler } from 'express';
import type { Server } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createAnalyticsTestDatabase } from '../routes/analytics/v2/test-database';
import { setupAnalyticsV2Routes } from '../routes/analytics/v2/setup-routes';
import { setupAcquisitionRoutes } from '../routes/analytics/acquisition/routes';
import { registerAnalyticsV2Tools } from '../../lib/bot-tools/mcp-register-analytics-v2-tools';
import { backfillAudienceEvidenceBatch } from '../database/analytics-v2/evidence-backfill';
/** Настоящая база в уникальной удаляемой схеме. */
const database = createAnalyticsTestDatabase();
/** Один явный календарный диапазон для обоих транспортов. */
const range = { from: '2026-10-19T21:00:00Z', to: '2026-10-20T21:00:00Z', timezone: 'Europe/Moscow' };
/** Одинаковая тестовая личность прямого API и SDK без браузерного mock fetch. */
const headers = { Authorization: 'Bearer parity-owner' };
/** Локальный HTTP-сервер, отдельный MCP-сервер и SDK-клиент. */
let http: Server, base: string, mcp: McpServer, client: Client;
/** Выполняет прямой HTTP-запрос к тем же маршрутам, которые использует MCP. */
async function request(endpoint: string, query: Record<string, string>, projectId = 1) {
  const response = await fetch(`${base}/api/projects/${projectId}/analytics/${endpoint}?${new URLSearchParams(query)}`, { headers });
  return { status: response.status, body: await response.json() };
}
/** Вызывает настоящий инструмент SDK и разбирает его обычный текстовый JSON-ответ. */
async function tool(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as Array<{ /** Вид блока. */ type: string; /** Текст ответа. */ text?: string }>;
  expect(content[0]?.type).toBe('text');
  return { isError: result.isError === true, body: JSON.parse(content[0].text!) };
}
/** Проверяет реальное время снимка отдельно, не маскируя остальные отличия ответа. */
function assertTimestamp(value: unknown, started: number) {
  expect(typeof value).toBe('string');
  const timestamp = Date.parse(value as string);
  expect(timestamp).toBeGreaterThanOrEqual(started);
  expect(timestamp).toBeLessThanOrEqual(Date.now());
}
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`SELECT mark_analytics_runtime_v2(1,11); SELECT mark_analytics_runtime_v2(1,12);
    UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01T00:00:00Z';
    INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Канал сравнения');
    INSERT INTO analytics_placements(id,project_id,token_id,source_id,name,timezone)
      VALUES(8,1,11,7,'Публикация 20 октября','Europe/Moscow');
    INSERT INTO analytics_links(id,project_id,token_id,source_id,placement_id,code) VALUES(9,1,11,7,8,'bc_parity');
    INSERT INTO analytics_expenses(project_id,placement_id,amount,currency,day) VALUES(1,8,3000.00,'RUB','2026-10-20');`);
  await database.record({ event_key: 'msg:900:1', user_id: '900', chat_id: '900', occurred_at: '2026-10-19T12:00:00Z' });
  for (const user of ['1000', '1001', '900']) await database.record({ event_key: `msg:${user}:2`, user_id: user, chat_id: user,
    source_id: 7, placement_id: 8, link_id: 9, attribution_status: 'resolved', metadata: { entry: true } });
  await database.record({ token_id: 12, event_key: 'msg:1000:3', user_id: '1000', chat_id: '1000' });
  await database.record({ event_key: 'cb:1001', kind: 'callback', user_id: '1001', metadata: { button_label: 'Каталог' } });
  await database.record({ event_key: 'msg:-100:4', user_id: '2000', chat_id: '-100', chat_type: 'group', directed: false });
  await database.record({ event_key: 'out:1000:5', kind: 'message_out', user_id: '1000' });
  const app = express(); app.use(express.json());
  const access: RequestHandler = (req, res, next) => {
    if (req.headers.authorization !== headers.Authorization || req.params.id !== '1') { res.status(403).json({ message: 'Нет доступа' }); return; }
    next();
  };
  setupAnalyticsV2Routes(app, database.pool, access); setupAcquisitionRoutes(app, database.pool, access);
  http = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  base = `http://127.0.0.1:${(http.address() as { port: number }).port}`;
  vi.stubEnv('API_BASE_URL', base); vi.stubEnv('MCP_AGENT_TOKEN', 'parity-owner');
  mcp = new McpServer({ name: 'analytics-parity', version: '2' }); registerAnalyticsV2Tools(mcp);
  client = new Client({ name: 'analytics-parity-client', version: '2' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcp.connect(serverTransport); await client.connect(clientTransport);
}, 30000);
afterAll(async () => {
  await client?.close(); await mcp?.close();
  if (http) await new Promise<void>(resolve => http.close(() => resolve()));
  vi.unstubAllEnvs(); await database.cleanup();
});
describe('Настоящее соответствие API и MCP', () => {
  it.each([undefined, 11])('возвращает одинаковый снимок проекта и бота %s', async token => {
    const started = Date.now();
    const query = { ...range, step: '1h', comparison: 'previous', ...(token ? { tokenId: String(token) } : {}) };
    const direct = await request('v2/snapshot', query);
    const remote = await tool('db_get_analytics_v2', { project_id: 1, ...range, step: '1h', comparison: 'previous', ...(token ? { token_id: token } : {}) });
    expect(direct.status).toBe(200); expect(remote.isError).toBe(false);
    const { as_of: directTime, ...directData } = direct.body;
    const { as_of: remoteTime, ...remoteData } = remote.body;
    assertTimestamp(directTime, started); assertTimestamp(remoteTime, started);
    expect(remoteData).toEqual(directData);
    expect(directData.current.audience).toMatchObject({ new_users: 2, total_users: 3, active_users: 3, returning_users: 1 });
    expect(directData.coverage.status).toBe('complete'); expect(directData.current.messages.callbacks).toBe(1);
    expect(directData.next_recompute_at).toBeNull();
  });
  it('возвращает одинаковые decimal-строки, null валюты и цену для календарного дня', async () => {
    const started = Date.now(), query = { ...range, currency: 'RUB', tokenId: '11' };
    const direct = await request('acquisition/report', query);
    const remote = await tool('db_get_acquisition_report', { project_id: 1, ...query });
    expect(direct.status).toBe(200); expect(remote.isError).toBe(false);
    const { asOf: directTime, ...directData } = direct.body;
    const { asOf: remoteTime, ...remoteData } = remote.body;
    assertTimestamp(directTime, started); assertTimestamp(remoteTime, started);
    expect(remoteData).toEqual(directData);
    expect(directData.rows[0]).toMatchObject({ newUsers: 2, returningUsers: 1, repeatStarts: 1,
      spend: { RUB: '3000.00', USD: null }, costPerUser: '1500.00', costPerUserByCurrency: { RUB: '1500.00', USD: null }, complete: true });
  });
  it.each([['v2/snapshot', 'db_get_analytics_v2'], ['acquisition/report', 'db_get_acquisition_report']])('запрещает чужой проект через %s и MCP', async (endpoint, name) => {
    const direct = await request(endpoint, range, 2);
    const remote = await tool(name, { project_id: 2, ...range });
    expect(direct.status).toBe(403); expect(remote.isError).toBe(true);
    expect(remote.body).toEqual({ error: 'API аналитики недоступен: HTTP 403', status: 403 });
    expect(remote.body).not.toHaveProperty('rows'); expect(remote.body).not.toHaveProperty('current');
  });
  it('одинаково восстанавливает человека по старому свидетельству без добавления физического клика', async () => {
    await database.pool.query("INSERT INTO bot_users(project_id,token_id,user_id,is_bot) VALUES(1,11,3333,0)");
    const { rows: [message] } = await database.pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,
      message_data,chat_type,chat_id,created_at) VALUES(1,11,'3333','user',
      '{"button_clicked":true,"button_text":"Каталог","callback_data":"catalog"}', 'private','3333','2026-10-20T12:00:00Z') RETURNING id`);
    const writer = await database.pool.connect();
    try {
      await writer.query('BEGIN');
      await backfillAudienceEvidenceBatch(writer, { projectId: 1, tokenId: 11, throughMessageId: message.id,
        historicalUsername: 'first_bot', writerSha256: '1'.repeat(64) });
      await writer.query('COMMIT');
    } catch (error) { await writer.query('ROLLBACK'); throw error; }
    finally { writer.release(); }
    const direct = await request('v2/snapshot', { ...range, tokenId: '11' });
    const remote = await tool('db_get_analytics_v2', { project_id: 1, token_id: 11, ...range });
    expect(direct.status).toBe(200); expect(remote.isError).toBe(false);
    const { as_of: directTime, ...directData } = direct.body;
    const { as_of: remoteTime, ...remoteData } = remote.body;
    expect(Number.isFinite(Date.parse(directTime))).toBe(true);
    expect(Number.isFinite(Date.parse(remoteTime))).toBe(true);
    expect(remoteData).toEqual(directData);
    expect(directData.current.audience).toMatchObject({ new_users: 2, restored_users: 1,
      total_users: 4, active_users: 4, first_history_status: 'partial' });
    expect(directData.current.messages.callbacks).toBe(1);
  });
});
