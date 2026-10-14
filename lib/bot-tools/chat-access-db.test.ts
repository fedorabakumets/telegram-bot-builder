/** @fileoverview Тесты фактической проверки доступа бота к чату. */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkChatAccessInDb } from './chat-access-db.ts';

const fetchMock = vi.fn();
vi.mock('./api-fetch.ts', () => ({ apiFetch: (...args: unknown[]) => fetchMock(...args) }));

describe('checkChatAccessInDb', () => {
  beforeEach(() => fetchMock.mockReset());
  it('вызывает Telegram-проверку и возвращает обновлённые метаданные', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ synced: true,
      group: { name: 'Чат', avatarUrl: '/avatar', chatType: 'supergroup' },
      accessStatus: 'available', accessCheckedAt: '2026-10-14T08:00:00.000Z' }) });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '-1003', chat_type: 'group' }))
      .resolves.toMatchObject({ access_status: 'available', title: 'Чат', avatar_url: '/avatar' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/groups/-1003/sync?tokenId=2'), { method: 'POST' },
    );
  });
  it('возвращает сохранённое исключение даже при ошибочном HTTP-статусе Telegram', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({
      accessStatus: 'kicked', accessCheckedAt: '2026-10-14T08:00:00.000Z',
    }) });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '-1003', chat_type: 'group' }))
      .resolves.toMatchObject({ ok: true, access_status: 'kicked' });
  });
  it('проверяет блокировку в личном чате отдельным маршрутом', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({
      accessStatus: 'kicked', accessCheckedAt: '2026-10-14T08:00:00.000Z', blocked: true,
    }) });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '1003', chat_type: 'private' }))
      .resolves.toMatchObject({ access_status: 'kicked', blocked: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/dialogs/1003/check-access?tokenId=2'), { method: 'POST' },
    );
  });
  it('возвращает безопасную ошибку без внутренних данных Telegram', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'secret' }) });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '-1003', chat_type: 'group' }))
      .resolves.toEqual({ error: 'Не удалось проверить доступ: HTTP 500' });
  });
});
