/**
 * @fileoverview Auth middleware для remote MCP: Bearer PAT обязателен
 * @module server/routes/mcp/requireMcpBearer
 */

import type { NextFunction, Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { consumeMcpRateLimit } from './mcpRateLimit';

/**
 * Извлекает Bearer из Authorization.
 * @param req - Express request
 * @returns Токен или null
 */
function extractBearer(req: Request): string | null {
  const auth = req.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

/**
 * Требует валидный MCP PAT, ставит req.user и req.mcpAgentToken.
 * Rate limit по IP до резолва и по ownerId после.
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export async function requireMcpBearer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ipKey = `ip:${req.ip || 'unknown'}`;
  if (!consumeMcpRateLimit(ipKey)) {
    res.status(429).json({ error: 'RATE_LIMITED' });
    return;
  }

  const raw = extractBearer(req);
  if (!raw) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  try {
    const owner = await storage.resolveAgentToken(raw);
    if (!owner) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    if (!consumeMcpRateLimit(`owner:${owner.id}`)) {
      res.status(429).json({ error: 'RATE_LIMITED' });
      return;
    }
    req.user = owner;
    req.mcpAgentToken = raw;
    next();
  } catch (error) {
    console.error('[requireMcpBearer] Ошибка резолва токена:', error);
    res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}
