/** @fileoverview Обновление профиля при проверке чата независимо от доступности отправки. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), query: vi.fn(), blocked: vi.fn(), deleted: vi.fn(), access: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../storages/storage', () => ({ storage: { markBotUserBlocked: mocks.blocked, markBotUserDeleted: mocks.deleted } }));
vi.mock('../../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../dialogs/access-store', () => ({ saveChatAccess: mocks.access }));
import { refreshPrivateChatProfile } from '../dialogs/refresh-private-chat-profile';
import { persistChatAccessOutcome } from '../dialogs/check-chat-access-core';
/** Создаёт безопасный ответ Telegram без настоящего токена. */
function reply(body: unknown, ok = true) { return { ok, json: async () => body }; }
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockResolvedValue({ rows: [], rowCount: 1 });
  mocks.access.mockImplementation(async (_project, _token, _chat, status) => ({ accessStatus: status }));
});
/** Область обновления ограничена проектом, ботом и Telegram ID, активность не изменяется. */
it('обновляет username, имя и фамилию только нужного профиля', async () => {
  mocks.fetch.mockResolvedValue(reply({ ok: true, result: { id: 123, type: 'private', username: 'new_name', first_name: 'Анна', last_name: 'Иванова' } }));
  expect(await refreshPrivateChatProfile(12, 9, '123', 'test-token')).toBe(true);
  expect(mocks.fetch.mock.calls[0][0]).toMatch(/\/getChat$/);
  expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ chat_id: '123' });
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '123', 'new_name', 'Анна', 'Иванова']);
  expect(mocks.query.mock.calls[0][0]).not.toMatch(/last_interaction|interaction_count|is_blocked|is_deleted/);
});
/** Успешный ответ без username явно удаляет прежнее имя пользователя. */
it('снимает старый username, если Telegram больше его не возвращает', async () => {
  mocks.fetch.mockResolvedValue(reply({ ok: true, result: { id: 123, type: 'private', first_name: 'Анна' } }));
  await refreshPrivateChatProfile(12, 9, '123', 'test-token');
  expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, '123', null, 'Анна', null]);
});
/** Ошибка, чужой чат или неполный ответ не стирают сохранённые данные. */
it.each([
  { ok: false, error_code: 429 },
  { ok: true, result: { id: 456, type: 'private', first_name: 'Другой' } },
  { ok: true, result: { id: 123, type: 'group', first_name: 'Группа' } },
  { ok: true, result: { id: 123, type: 'private' } },
])('не обновляет профиль по неподходящему ответу %j', async body => {
  mocks.fetch.mockResolvedValue(reply(body));
  expect(await refreshPrivateChatProfile(12, 9, '123', 'test-token')).toBe(false);
  expect(mocks.query).not.toHaveBeenCalled();
});
/** Успешное чтение профиля не доказывает право отправки сообщения. */
it('сохраняет блокировку чата при успешном получении профиля', async () => {
  mocks.fetch.mockResolvedValue(reply({ ok: true, result: { id: 123, type: 'private', first_name: 'Анна' } }));
  expect(await persistChatAccessOutcome(12, 9, '123', { kind: 'kicked', status: 'kicked' }, 'test-token')).toEqual({ accessStatus: 'kicked' });
  expect(mocks.blocked).toHaveBeenCalledWith(12, 9, 123);
  expect(mocks.query).toHaveBeenCalledTimes(1);
});
/** Сетевой сбой getChat не превращает успешную проверку отправки в ошибку. */
it('сохраняет успешную проверку при недоступном getChat', async () => {
  mocks.fetch.mockRejectedValue(new Error('Сетевая ошибка'));
  expect(await persistChatAccessOutcome(12, 9, '123', { kind: 'available', status: 'available' }, 'test-token')).toEqual({ accessStatus: 'available' });
  expect(mocks.query).toHaveBeenCalledTimes(1);
  expect(mocks.query.mock.calls[0][0]).toContain('is_blocked = 0');
});
