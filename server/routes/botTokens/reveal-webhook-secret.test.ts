/** @fileoverview Проверки раскрытия секрета только внутри проекта и запрета журналирования. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mayLogApiResponse } from '../../utils/api-log-policy';
const mocks = vi.hoisted(() => ({ getBotToken: vi.fn(), getBotProject: vi.fn(), actor: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: mocks }));
vi.mock('../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: mocks.actor }));
import { revealWebhookSecret } from './reveal-webhook-secret';

/** Создаёт ответ с перехватом HTTP-статуса и тела. */
function response() {
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}
beforeEach(() => { vi.clearAllMocks(); mocks.getBotProject.mockResolvedValue({ ownerId: 1 }); mocks.actor.mockReturnValue(1); });

it('не раскрывает секрет чужого проекта', async () => {
  mocks.getBotToken.mockResolvedValue({ projectId: 99, webhookSecretToken: 'private' });
  const res = response();
  await revealWebhookSecret({ params: { projectId: '12', tokenId: '58' } } as unknown as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain('private');
});

it('не раскрывает секрет коллаборатору с доступом к проекту', async () => {
  mocks.getBotToken.mockResolvedValue({ projectId: 12, webhookSecretToken: 'private' });
  mocks.actor.mockReturnValue(2);
  const res = response();
  await revealWebhookSecret({ params: { projectId: '12', tokenId: '58' } } as unknown as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain('private');
});

it('показывает значение по явному запросу без кеширования и логирования ответа', async () => {
  mocks.getBotToken.mockResolvedValue({ projectId: 12, webhookSecretToken: 'private' });
  const res = response();
  await revealWebhookSecret({ params: { projectId: '12', tokenId: '58' } } as unknown as Request, res as unknown as Response);
  expect(res.json).toHaveBeenCalledWith({ value: 'private' });
  expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
  expect(mayLogApiResponse('/api/projects/12/tokens/58/webhook-secret/reveal')).toBe(false);
});
