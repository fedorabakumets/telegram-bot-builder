/** @fileoverview Проверки сохранения исключения бота без потери метаданных группы. */
import { beforeEach, expect, it, vi } from 'vitest';
import { syncGroupHandler } from '../../server/routes/botIntegration/handlers/groups/syncGroupHandler';
import { enrichDialogAccess } from '../../server/routes/dialogs/access-store';
import { requireProjectAccess } from '../../server/middleware/requireProjectAccess';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), query: vi.fn(), token: vi.fn(), update: vi.fn(),
  group: vi.fn(), create: vi.fn(), defaultToken: vi.fn(), permission: vi.fn() }));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 7 }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotToken: mocks.token,
  getDefaultBotToken: mocks.defaultToken, getBotGroupByProjectAndGroupId: mocks.group,
  updateBotGroup: mocks.update, createBotGroup: mocks.create, hasProjectAccess: mocks.permission } }));

/**
 * Вызывает синхронизацию выбранной группы с имитированным ответом HTTP.
 * @returns Ответ обработчика
 */
async function sync() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await syncGroupHandler({ params: { projectId: '12', groupId: '-1001' },
    query: { tokenId: '9' } } as never, res as never);
  return res;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.token.mockResolvedValue({ id: 9, projectId: 12, token: 'тестовый-токен' });
  mocks.query.mockResolvedValue({ rows: [{ accessStatus: 'kicked', accessCheckedAt: '2026-10-13' }] });
});
it('сохраняет исключение, не меняя название и аватарку', async () => {
  mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ ok: false,
    description: 'Forbidden: bot was kicked from the supergroup chat' }) });
  const res = await sync();
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '-1001', 'kicked']);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.create).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessStatus: 'kicked' }));
});
it('прочая ошибка не превращается в исключение', async () => {
  mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ description: 'Bad Request: chat not found' }) });
  await sync();
  expect(mocks.query.mock.calls[0][1][3]).toBe('error');
});
it('после возвращения сохраняет доступ и обновлённое название', async () => {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true,
    result: { title: 'Наш чат', type: 'supergroup' } }) });
  mocks.group.mockResolvedValue({ id: 1, name: 'Старое название' });
  mocks.update.mockResolvedValue({ id: 1, name: 'Наш чат' });
  await sync();
  expect(mocks.update.mock.calls[0][1].name).toBe('Наш чат');
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '-1001', 'available']);
});
it('не подставляет дефолтный токен, если выбран чужой', async () => {
  mocks.token.mockResolvedValue({ id: 9, projectId: 13, token: 'чужой' });
  const res = await sync();
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.defaultToken).not.toHaveBeenCalled();
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('проверка доступа не пропускает чужой проект в обработчик', async () => {
  mocks.permission.mockResolvedValue(false);
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  await requireProjectAccess({ params: { projectId: '12' } } as never, res as never, next);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(next).not.toHaveBeenCalled();
});
it('восстанавливает статус UI из точной области и не назначает его личному чату', async () => {
  mocks.query.mockResolvedValue({ rows: [{ chat_id: '-1001', status: 'kicked', checked_at: '2026-10-13' }] });
  const result = await enrichDialogAccess(12, 9, [{ userId: '-1001', isGroup: true }, { userId: '1' }]);
  expect(result[0].accessStatus).toBe('kicked');
  expect(result[1].accessStatus).toBe('unknown');
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, ['-1001']]);
});
