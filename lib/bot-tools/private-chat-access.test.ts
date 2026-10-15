/** @fileoverview Тесты проверки блокировки бота в личном чате. */
import { beforeEach, expect, it, vi } from 'vitest';
import { checkPrivateChatAccessHandler } from '../../server/routes/dialogs/check-private-chat-access-handler';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(), query: vi.fn(), token: vi.fn(), block: vi.fn(), deleted: vi.fn(),
}));
vi.mock('../../server/utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/storages/storage', () => ({
  storage: { getBotToken: mocks.token, markBotUserBlocked: mocks.block, markBotUserDeleted: mocks.deleted },
}));

/**
 * Запускает проверку тестового личного чата.
 * @returns Имитированный HTTP-ответ
 */
async function check() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await checkPrivateChatAccessHandler({ params: { projectId: '12', chatId: '1001' },
    query: { tokenId: '9' } } as never, res as never);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.token.mockResolvedValue({ id: 9, projectId: 12, token: 'тестовый-токен' });
  mocks.query.mockResolvedValue({ rows: [{ accessStatus: 'available', accessCheckedAt: '2026-10-14' }] });
});

it('сохраняет блокировку и обновляет пользователя', async () => {
  mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({
    description: 'Forbidden: bot was blocked by the user',
  }) });
  const res = await check();
  expect(mocks.fetch.mock.calls[0][0]).toContain('/sendChatAction');
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '1001', 'kicked']);
  expect(mocks.block).toHaveBeenCalledWith(12, 9, 1001);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ blocked: true }));
});

it('снимает блокировку после успешной проверки', async () => {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  await check();
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '1001', 'available']);
  expect(mocks.query.mock.calls[1][0]).toContain('is_blocked = 0');
  expect(mocks.query.mock.calls[1][1]).toEqual([12, 9, 1001]);
});

it('помечает удалённый аккаунт и не возвращает текст Telegram', async () => {
  mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({
    error_code: 403, description: 'Forbidden: user is deactivated',
  }) });
  const res = await check();
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '1001', 'error']);
  expect(mocks.deleted).toHaveBeenCalledWith(12, 9, 1001);
  expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('deactivated');
});

it('не вызывает Telegram для чужого токена', async () => {
  mocks.token.mockResolvedValue({ id: 9, projectId: 13, token: 'чужой' });
  const res = await check();
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.fetch).not.toHaveBeenCalled();
});
