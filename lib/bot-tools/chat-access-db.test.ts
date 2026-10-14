/** @fileoverview Тесты чтения сохранённого состояния доступа к чату. */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkChatAccessInDb } from './chat-access-db.ts';

const fetchMock = vi.fn();
vi.mock('./api-fetch.ts', () => ({ apiFetch: (...args: unknown[]) => fetchMock(...args) }));

describe('checkChatAccessInDb', () => {
  beforeEach(() => fetchMock.mockReset());
  it('возвращает сохранённый статус и параметры области', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, project_id: 1,
      token_id: 2, chat_id: '-1003', chat_type: 'group', access_status: 'kicked', access_checked_at: null }) });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '-1003', chat_type: 'group' }))
      .resolves.toMatchObject({ access_status: 'kicked' });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/projects/1/dialogs/-1003/access?'));
  });
  it('возвращает безопасную ошибку API', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(checkChatAccessInDb(1, { token_id: 2, chat_id: '-1003', chat_type: 'group' }))
      .resolves.toEqual({ error: 'Не удалось проверить доступ: HTTP 404' });
  });
});
