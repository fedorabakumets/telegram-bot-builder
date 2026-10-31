/** @fileoverview Проверки подписи, повторов, лимитов и закрытого отказа Redis. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { signAgentRequest } from './signature';
const redis = vi.hoisted(() => ({ status: 'ready', set: vi.fn(), eval: vi.fn() }));
vi.mock('../../redis/redisClient', () => ({ getRedisPublisher: () => redis }));
import { verifyAgent, limitAgentUser } from './guard';

/** Создаёт запрос с подписью исходных байтов. */
function request(body = '{"id":42,"firstName":"Тест"}', seconds = 0): Request {
  const stamp = String(Math.floor(Date.now() / 1000) + seconds);
  const nonce = randomBytes(16).toString('hex');
  const headers: Record<string, string> = { 'X-Agent-Id': 'bot-builder-agent', 'X-Agent-Timestamp': stamp,
    'X-Agent-Nonce': nonce, 'X-Agent-Signature': signAgentRequest('s'.repeat(32), 'POST', '/api/auth/agent/telegram', stamp, nonce, Buffer.from(body)) };
  return { method: 'POST', originalUrl: '/api/auth/agent/telegram', ip: '127.0.0.1',
    agentRawBody: Buffer.from(body), get: (key: string) => headers[key] } as unknown as Request;
}
beforeEach(() => {
  vi.stubEnv('AGENT_AUTO_AUTH_ENABLED', 'true'); vi.stubEnv('AGENT_AUTO_AUTH_SECRET', 's'.repeat(32));
  vi.stubEnv('AGENT_AUTO_AUTH_ALLOWED_IDS', ''); redis.status = 'ready';
  redis.set.mockReset().mockResolvedValue('OK'); redis.eval.mockReset().mockResolvedValue(1);
});
describe('Доверенный обмен', () => {
  it('принимает подпись и атомарно сохраняет nonce на 120 секунд', async () => {
    expect(await verifyAgent(request())).toBe('bot-builder-agent');
    expect(redis.set).toHaveBeenCalledWith(expect.stringContaining('agent-auth:nonce:'), '1', 'EX', 120, 'NX');
  });
  it('отклоняет изменённое тело', async () => {
    const req = request(); Object.assign(req, { agentRawBody: Buffer.from('{}') });
    await expect(verifyAgent(req)).rejects.toMatchObject({ status: 401 });
  });
  it('отклоняет неверный ключ', async () => {
    const req = request(); vi.stubEnv('AGENT_AUTO_AUTH_SECRET', 'x'.repeat(32));
    await expect(verifyAgent(req)).rejects.toMatchObject({ status: 401 });
  });
  it.each([-61, 61])('отклоняет время %s секунд', async (seconds) => {
    await expect(verifyAgent(request(undefined, seconds))).rejects.toMatchObject({ status: 401 });
  });
  it('отклоняет повтор nonce', async () => {
    redis.set.mockResolvedValue(null); await expect(verifyAgent(request())).rejects.toMatchObject({ status: 409 });
  });
  it('без ключа закрыт', async () => {
    vi.stubEnv('AGENT_AUTO_AUTH_SECRET', ''); await expect(verifyAgent(request())).rejects.toMatchObject({ status: 503 });
  });
  it('без Redis закрыт', async () => {
    redis.status = 'end'; await expect(verifyAgent(request())).rejects.toMatchObject({ status: 503 });
  });
  it('ограничивает агента', async () => {
    redis.eval.mockResolvedValue(301); await expect(verifyAgent(request())).rejects.toMatchObject({ status: 429 });
  });
  it('ограничивает пользователя', async () => {
    redis.eval.mockResolvedValue(11); await expect(limitAgentUser('agent', 42)).rejects.toMatchObject({ status: 429 });
  });
  it('ограничивает неправильные подписи по IP', async () => {
    redis.eval.mockResolvedValue(21); await expect(verifyAgent(request('', -90))).rejects.toMatchObject({ status: 429 });
  });
  it('ограничивает поэтапное включение', async () => {
    vi.stubEnv('AGENT_AUTO_AUTH_ALLOWED_IDS', '99');
    await expect(limitAgentUser('agent', 42)).rejects.toMatchObject({ status: 403 });
  });
});
