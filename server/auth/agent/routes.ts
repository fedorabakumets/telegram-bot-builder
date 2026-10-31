/** @fileoverview Серверные маршруты обмена и управление подключениями через браузерную сессию. */
import type { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AgentAuthError } from './config';
import { verifyAgent, limitAgentUser } from './guard';
import { exchangeAgentToken, disconnectAgent, listConnections, setConnectionState } from './repository';

/** Данные берутся только из Telegram Update доверенным агентом. */
const identitySchema = z.object({
  /** Telegram ID */
  id: z.number().int().positive().safe(),
  /** Имя человека */
  firstName: z.string().min(1).max(256),
  /** Фамилия */
  lastName: z.string().max(256).optional(),
  /** Имя пользователя */
  username: z.string().max(64).optional(),
}).strict();

/** Возвращает безопасную ошибку без содержимого тела, подписи и токена. */
function fail(res: Response, error: unknown): void {
  const known = error instanceof AgentAuthError;
  res.status(known ? error.status : 503).json({ error: known ? error.code : 'AUTO_AUTH_UNAVAILABLE' });
}

/** Требует сессию владельца; PAT и административный обход не подходят. */
function requireOwnerSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.telegramUser?.id || req.session.telegramUser.id !== req.user?.id) {
    res.status(401).json({ error: 'SESSION_REQUIRED' }); return;
  }
  if (req.method !== 'GET' && req.get('Origin') !== `${req.protocol}://${req.get('host')}`) {
    res.status(403).json({ error: 'ORIGIN_MISMATCH' }); return;
  }
  next();
}

/** Подключает маршруты, не публикуемые как инструменты MCP. */
export function setupAgentAutoAuthRoutes(app: Express): void {
  for (const action of ['telegram', 'disconnect'] as const) {
    app.post(`/api/auth/agent/${action}`, async (req, res) => {
      res.set('Cache-Control', 'no-store');
      try {
        const agentId = await verifyAgent(req);
        const parsed = (action === 'telegram' ? identitySchema : identitySchema.pick({ id: true })).safeParse(req.body);
        if (!parsed.success) throw new AgentAuthError(400, 'INVALID_REQUEST');
        await limitAgentUser(agentId, parsed.data.id);
        if (action === 'disconnect') {
          await disconnectAgent(agentId, parsed.data.id);
          res.json({ success: true });
        } else res.json(await exchangeAgentToken(agentId, identitySchema.parse(parsed.data)));
      } catch (error) { fail(res, error); }
    });
  }
  app.get('/api/agent-connections', requireOwnerSession, async (req, res) => {
    try { res.json(await listConnections(req.session.telegramUser!.id)); }
    catch (error) { fail(res, error); }
  });
  app.patch('/api/agent-connections/:id', requireOwnerSession, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const body = z.object({ enabled: z.boolean() }).strict().safeParse(req.body);
      if (!Number.isSafeInteger(id) || id <= 0 || !body.success) throw new AgentAuthError(400, 'INVALID_REQUEST');
      if (!await setConnectionState(req.session.telegramUser!.id, id, body.data.enabled)) throw new AgentAuthError(404, 'NOT_FOUND');
      res.json({ success: true });
    } catch (error) { fail(res, error); }
  });
}
