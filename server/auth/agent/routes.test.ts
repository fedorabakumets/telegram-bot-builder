/** @fileoverview Проверка HTTP-контракта и восстановления исключительно браузерной сессией. */
import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { captureAgentBody, signAgentRequest } from './signature';
const repo = vi.hoisted(() => ({ exchangeAgentToken: vi.fn(), disconnectAgent: vi.fn(), listConnections: vi.fn(), setConnectionState: vi.fn() }));
const redis = vi.hoisted(() => ({ status: 'ready', set: vi.fn(), eval: vi.fn() }));
vi.mock('./repository', () => repo);
vi.mock('../../redis/redisClient', () => ({ getRedisPublisher: () => redis }));
import { setupAgentAutoAuthRoutes } from './routes';
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express(); app.use(express.json({ verify: captureAgentBody }));
  app.use((req, _res, next) => {
    if (req.get('X-Test-Session')) Object.assign(req, { session: { telegramUser: { id: 42 } }, user: { id: 42 } });
    next();
  });
  setupAgentAutoAuthRoutes(app);
  server = await new Promise<Server>((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => {
  vi.stubEnv('AGENT_AUTO_AUTH_ENABLED', 'true'); vi.stubEnv('AGENT_AUTO_AUTH_SECRET', 's'.repeat(32));
  vi.stubEnv('AGENT_AUTO_AUTH_ALLOWED_IDS', ''); redis.set.mockResolvedValue('OK'); redis.eval.mockResolvedValue(1);
  repo.exchangeAgentToken.mockResolvedValue({ token: 'mcp_test', expiresAt: new Date().toISOString(), connectionId: 1, ownerId: 42 });
  repo.setConnectionState.mockReset().mockResolvedValue(true);
});
/** Отправляет подписанный запрос без участия пользовательской сессии. */
function signed(body: object) {
  const raw = JSON.stringify(body), path = '/api/auth/agent/telegram';
  const timestamp = String(Math.floor(Date.now() / 1000)), nonce = '0'.repeat(32);
  return fetch(base + path, { method: 'POST', body: raw, headers: { 'Content-Type': 'application/json',
    'X-Agent-Id': 'bot-builder-agent', 'X-Agent-Timestamp': timestamp, 'X-Agent-Nonce': nonce,
    'X-Agent-Signature': signAgentRequest('s'.repeat(32), 'POST', path, timestamp, nonce, Buffer.from(raw)) } });
}
it('выдаёт контракт с запретом кэширования', async () => {
  const res = await signed({ id: 42, firstName: 'Тест' });
  expect(res.status).toBe(200); expect(res.headers.get('cache-control')).toBe('no-store');
  expect(await res.json()).toMatchObject({ token: 'mcp_test', ownerId: 42, connectionId: 1 });
});
it('отклоняет некорректный ID', async () => { expect((await signed({ id: '42', firstName: 'Тест' })).status).toBe(400); });
it('PAT не позволяет восстановить подключение', async () => {
  const res = await fetch(base + '/api/agent-connections/1', { method: 'PATCH', headers: {
    Authorization: 'Bearer mcp_test', 'Content-Type': 'application/json', Origin: base }, body: '{"enabled":true}' });
  expect(res.status).toBe(401); expect(repo.setConnectionState).not.toHaveBeenCalled();
});
it('требует совпадения Origin даже при браузерной сессии', async () => {
  const res = await fetch(base + '/api/agent-connections/1', { method: 'PATCH', headers: {
    'X-Test-Session': 'yes', 'Content-Type': 'application/json', Origin: 'https://other.example' }, body: '{"enabled":true}' });
  expect(res.status).toBe(403); expect(repo.setConnectionState).not.toHaveBeenCalled();
});
it('явное действие с сессией восстанавливает доступ только владельцу', async () => {
  const res = await fetch(base + '/api/agent-connections/1', { method: 'PATCH', headers: {
    'X-Test-Session': 'yes', 'Content-Type': 'application/json', Origin: base }, body: '{"enabled":true}' });
  expect(res.status).toBe(200); expect(repo.setConnectionState).toHaveBeenCalledWith(42, 1, true);
});
