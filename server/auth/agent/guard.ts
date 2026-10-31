/** @fileoverview Проверка подписи, распределённых лимитов и защиты от повторов. */
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { getRedisPublisher } from '../../redis/redisClient';
import { AgentAuthError, agentAuthConfig } from './config';
import { equalSignature, signAgentRequest, type AgentRawRequest } from './signature';

/** Атомарный счётчик с фиксированным окном. */
const LIMIT_SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n";

/** Проверяет доверенного отправителя до чтения пользовательских данных. */
export async function verifyAgent(req: Request): Promise<string> {
  const cfg = agentAuthConfig();
  if (!cfg.enabled || cfg.secret.length < 32) throw new AgentAuthError(503, 'AUTO_AUTH_UNAVAILABLE');
  const redis = getRedisPublisher();
  if (!redis || redis.status !== 'ready') throw new AgentAuthError(503, 'AUTO_AUTH_UNAVAILABLE');
  const timestamp = req.get('X-Agent-Timestamp') || '';
  const nonce = req.get('X-Agent-Nonce') || '';
  const agentId = req.get('X-Agent-Id') || '';
  const signature = req.get('X-Agent-Signature') || '';
  const body = (req as AgentRawRequest).agentRawBody;
  const valid = agentId === cfg.agentId && /^\d{10}$/.test(timestamp)
    && Math.abs(Date.now() / 1000 - Number(timestamp)) <= 60
    && /^[a-f0-9]{32}$/.test(nonce) && !!body
    && equalSignature(signature, signAgentRequest(cfg.secret, req.method, req.originalUrl, timestamp, nonce, body));
  if (!valid) {
    const ip = createHash('sha256').update(req.ip || 'unknown').digest('hex');
    const n = Number(await redis.eval(LIMIT_SCRIPT, 1, `agent-auth:bad:${ip}`));
    throw new AgentAuthError(n > 20 ? 429 : 401, n > 20 ? 'RATE_LIMITED' : 'UNAUTHORIZED');
  }
  const accepted = await redis.set(`agent-auth:nonce:${agentId}:${nonce}`, '1', 'EX', 120, 'NX');
  if (!accepted) throw new AgentAuthError(409, 'REPLAY_DETECTED');
  const n = Number(await redis.eval(LIMIT_SCRIPT, 1, `agent-auth:agent:${agentId}`));
  if (n > 300) throw new AgentAuthError(429, 'RATE_LIMITED');
  return agentId;
}

/** Ограничивает частоту запросов одного подтверждённого пользователя. */
export async function limitAgentUser(agentId: string, ownerId: number): Promise<void> {
  const redis = getRedisPublisher();
  if (!redis || redis.status !== 'ready') throw new AgentAuthError(503, 'AUTO_AUTH_UNAVAILABLE');
  const n = Number(await redis.eval(LIMIT_SCRIPT, 1, `agent-auth:user:${agentId}:${ownerId}`));
  if (n > 10) throw new AgentAuthError(429, 'RATE_LIMITED');
  const allowed = agentAuthConfig().allowedIds;
  if (allowed.length && !allowed.includes(String(ownerId))) throw new AgentAuthError(403, 'AUTO_AUTH_NOT_ALLOWED');
}
