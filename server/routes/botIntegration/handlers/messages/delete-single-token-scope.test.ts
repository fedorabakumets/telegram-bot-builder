/** @fileoverview Проверки удаления сообщения только ботом исходной переписки. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  /** Чтение сообщения. */ read: vi.fn(),
  /** Поиск токена. */ resolve: vi.fn(),
  /** Явный токен запроса. */ requested: vi.fn(),
  /** Запрос Telegram без сети. */ fetch: vi.fn(),
  /** Удаление записи. */ remove: vi.fn(),
}));
vi.mock('../../../../database/db', () => ({ db: {
  select: () => ({ from: () => ({ where: mocks.read }) }),
  delete: () => ({ where: mocks.remove }),
} }));
vi.mock('@shared/schema', () => ({ botMessages: { id: 'id' } }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));
vi.mock('../../../utils/resolve-request-token', () => ({
  getRequestTokenId: mocks.requested, resolveEffectiveProjectToken: mocks.resolve,
}));
vi.mock('../../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: vi.fn() }));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://example.invalid' }));
import { deleteSingleMessageHandler } from './deleteSingleMessageHandler';

/** Запускает обработчик с тестовым сообщением без внешних действий. */
async function invoke() {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await deleteSingleMessageHandler({ params: { projectId: '12', messageId: '4' } } as never, response as never);
  return response;
}

describe('Бот исходного удаляемого сообщения', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.read.mockResolvedValue([{ id: 4, projectId: 12, tokenId: 7, telegramMessageId: 99, userId: '123' }]);
    mocks.requested.mockReturnValue(null);
    mocks.resolve.mockResolvedValue({ selectedToken: { id: 7, projectId: 12, token: 'test' } });
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });
  it('при общем выборе использует бота сообщения', async () => {
    const response = await invoke();
    expect(mocks.resolve).toHaveBeenCalledWith(12, 7);
    expect(mocks.fetch).toHaveBeenCalledWith('https://example.invalid/bottest/deleteMessage', expect.any(Object));
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(response.json).toHaveBeenCalledWith({ success: true, deletedFromTelegram: true });
  });
  it('отклоняет явного другого бота до обращения к Telegram', async () => {
    mocks.requested.mockReturnValue(8);
    const response = await invoke();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it.each([{ id: 8, projectId: 12 }, { id: 7, projectId: 13 }])('отклоняет резервного или чужого проекту бота: %j', async (token) => {
    mocks.resolve.mockResolvedValue({ selectedToken: { ...token, token: 'other' } });
    const response = await invoke();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('не ищет токен для сообщения другого проекта', async () => {
    mocks.read.mockResolvedValue([{ projectId: 13, tokenId: 7, telegramMessageId: 99 }]);
    const response = await invoke();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
