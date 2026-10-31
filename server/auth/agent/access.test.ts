/** @fileoverview Проверка изоляции проектов и отсутствия секретов в журналах. */
import { it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { redactSecrets } from '../../utils/redactSecrets';
vi.mock('../../storages/storage', () => ({ storage: {
  /** Единственный владелец тестового проекта. */
  hasProjectAccess: async (project: number, owner: number) => project === 10 && owner === 42,
} }));
vi.mock('../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: (req: Request) => req.user?.id ?? null }));
import { requireProjectAccess } from '../../middleware/requireProjectAccess';

it('персональная личность не даёт доступа к проекту другого пользователя', async () => {
  for (const owner of [42, 43]) {
    const req = { params: { projectId: '10' }, user: { id: owner } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await requireProjectAccess(req, res as unknown as Response, next);
    if (owner === 42) expect(next).toHaveBeenCalledOnce();
    else { expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled(); }
  }
});
it('скрывает PAT, межсервисный ключ и подпись в журнале', () => {
  vi.stubEnv('AGENT_AUTO_AUTH_SECRET', 'secret'.repeat(8));
  const output = redactSecrets(JSON.stringify({ token: 'mcp_automatic_token', 'X-Agent-Signature': 'f'.repeat(64),
    detail: 'secret'.repeat(8) }));
  expect(output).not.toContain('mcp_automatic_token'); expect(output).not.toContain('f'.repeat(64));
  expect(output).not.toContain('secret'.repeat(8));
});
