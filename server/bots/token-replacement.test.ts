/** @fileoverview Проверки замены отклонённого токена без обхода подтверждённой блокировки. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
const mocks = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), reset: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: {
  getBotProject: vi.fn(async () => ({ id: 2 })), hasProjectAccess: vi.fn(async () => true),
  getBotToken: mocks.get, updateBotToken: mocks.update,
} }));
vi.mock('../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: vi.fn(() => 7) }));
vi.mock('../terminal', () => ({ emitTokenUpdated: vi.fn(async () => undefined) }));
vi.mock('./botRestartManager', () => ({ resetRestartCounter: mocks.reset }));
vi.mock('../routes/botTokens/to-public-bot-token', () => ({
  isMaskedOrPlaceholderToken: (token: string) => token.includes('•'), toPublicBotToken: (token: unknown) => token,
}));
vi.mock('../routes/botTokens/token-write-receipt', () => ({ botTokenWriteReceipt: vi.fn(() => ({})) }));
import { updateProjectTokenHandler } from '../routes/botTokens/handlers/updateProjectTokenHandler';
/** Настраивает отклонённый секрет перед каждым запросом. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ id: 4, projectId: 2, token: '123:old', authorizationError: 'unauthorized', isActive: 0 });
  mocks.update.mockResolvedValue({ id: 4 });
});
/** Выполняет обработчик с имитацией ответа Express. */
async function request(body: unknown) {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  await updateProjectTokenHandler({ params: { id: '2', tokenId: '4' }, body } as unknown as Request, response as unknown as Response);
  return response;
}
it('новый секрет сбрасывает отказ и счётчик перезапуска', async () => {
  await request({ token: '123:new' });
  expect(mocks.update).toHaveBeenCalledWith(4, { token: '123:new', isActive: 1, authorizationError: null });
  expect(mocks.reset).toHaveBeenCalledWith(4);
});
it.each([{ isActive: 1 }, { token: '123:old', isActive: 1 }, { token: '123:••••', isActive: 1 }])(
  'не позволяет включить прежний или замаскированный секрет: %j', async body => {
    const response = await request(body);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
it('обычное переименование не сбрасывает отказ', async () => {
  await request({ name: 'Бот' });
  expect(mocks.update).toHaveBeenCalledWith(4, { name: 'Бот' });
  expect(mocks.reset).not.toHaveBeenCalled();
});
