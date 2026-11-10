/** @fileoverview Проверка полной загрузки аудитории без ограничения первой тысячей. */
import { afterEach, expect, it, vi } from 'vitest';
import { loadManualUsers } from './load-manual-users';

afterEach(() => vi.unstubAllGlobals());

it('загружает следующую страницу и исключает повторяющиеся ID', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ users: [{ userId: '1' }, { userId: '2' }], total: 4, hasMore: true }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ users: [{ userId: '2' }, { userId: '3' }], total: 4, hasMore: false }) });
  vi.stubGlobal('fetch', fetch);
  const users = await loadManualUsers(12, 11);
  expect(users.map((user) => user.userId)).toEqual(['1', '2', '3']);
  expect(fetch.mock.calls[1][0]).toContain('offset=2');
  expect(fetch.mock.calls[0][0]).toContain('tokenId=11');
});

it('не выдаёт неполный список за всю аудиторию при сбое пагинации', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ users: [], total: 1553, hasMore: true }),
  }));
  await expect(loadManualUsers(12, 11)).rejects.toThrow('полную аудиторию');
});

it('не скрывает ошибку сервера', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  await expect(loadManualUsers(12, 11)).rejects.toThrow('HTTP 503');
});
