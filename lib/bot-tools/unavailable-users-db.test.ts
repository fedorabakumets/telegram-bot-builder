/** @fileoverview Проверки ссылок и отказа списка недоступных людей. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listUnavailableUsersInDb } from './unavailable-users-db.ts';

const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal('fetch', fetchMock); vi.stubEnv('MCP_AGENT_TOKEN', 'test-agent-token'); });
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

/** Страница панели с одним человеком. */
function page(userName: string | null) {
  return { users: [{ userId: '8791555566', userName, firstName: '.', lastName: null, isDeleted: true, isBlocked: false }],
    total: 1, hasMore: false, limit: 20, offset: 0 };
}

describe('список недоступных', () => {
  /** Проверяет обе ссылки и фильтр бота. */
  it('собирает ссылки и не вызывает Telegram', async () => {
    fetchMock.mockResolvedValue(Response.json(page('Ho4y28')));
    const result = await listUnavailableUsersInDb(12, { tokenId: 10, kind: 'deleted', apiBaseUrl: 'http://test' });
    expect(result).toMatchObject({
      ok: true, users: [{ user_id: '8791555566', telegram_link: 'tg://user?id=8791555566', profile_link: 'https://t.me/Ho4y28' }],
    });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/projects/12/users/unavailable');
    expect(url.searchParams.get('tokenId')).toBe('10');
    expect(url.searchParams.get('kind')).toBe('deleted');
  });

  /** Проверяет отсутствие публичной ссылки без username. */
  it('не выдумывает ссылку t.me без username', async () => {
    fetchMock.mockResolvedValue(Response.json(page(null)));
    const result = await listUnavailableUsersInDb(12, { tokenId: 10 });
    expect(result).toHaveProperty('users.0.profile_link', null);
    expect(result).toHaveProperty('users.0.telegram_link', 'tg://user?id=8791555566');
  });

  /** Проверяет, что отказ доступа не отдаёт тело. */
  it('прячет тело HTTP-ошибки', async () => {
    fetchMock.mockResolvedValue(new Response('secret-user-row', { status: 403 }));
    const result = await listUnavailableUsersInDb(12, { tokenId: 10 });
    expect(JSON.stringify(result)).toContain('403');
    expect(JSON.stringify(result)).not.toContain('secret-user-row');
  });

  /** Проверяет ранний отказ без запроса. */
  it('не вызывает HTTP без бота', async () => {
    expect(await listUnavailableUsersInDb(12, {})).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
