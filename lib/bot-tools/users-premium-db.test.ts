/** @fileoverview Проверки Premium: фильтры, проценты UI и безопасное чтение API. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getUsersPremiumInDb } from './users-premium-db.ts';
import { runWithMcpToken } from './mcp-request-context.ts';

afterEach(() => vi.unstubAllGlobals());
describe('Снимок Premium', () => {
  it('передаёт фильтр бота и авторизацию, отбрасывая лишние поля', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ totalUsers: 7, premiumUsers: 2, secret: 'private' }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await runWithMcpToken('premium-test', () => getUsersPremiumInDb(289, { tokenId: 3, apiBaseUrl: 'http://test' }));
    expect(fetchMock.mock.calls[0][0]).toBe('http://test/api/projects/289/users/stats?tokenId=3');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer premium-test');
    expect(result).toMatchObject({ total_users: 7, premium_users: 2, regular_users: 5,
      items: [{ label: 'Premium', count: 2, percentage: 29 }, { label: 'Обычные', count: 5, percentage: 71 }] });
    expect(JSON.stringify(result)).not.toContain('private');
  });
  it.each([[0, 0, 0, 0], [2, 1, 50, 50], [200, 1, 1, 100]])(
    'округляет снимок %s/%s как UI', async (total, premium, premiumPercent, regularPercent) => {
      vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => Response.json({ totalUsers: total, premiumUsers: premium })));
      const result = await getUsersPremiumInDb(289);
      expect(result).toMatchObject({ items: [{ percentage: premiumPercent }, { percentage: regularPercent }], scope: 'current_snapshot' });
    });
  it.each([{ totalUsers: 1, premiumUsers: 2 }, { totalUsers: -1, premiumUsers: 0 },
    { totalUsers: '7', premiumUsers: 1 }, { totalUsers: 7 }, { totalUsers: 7, premiumUsers: 0.5 }])(
    'отклоняет некорректные счётчики %j', async raw => {
      vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => Response.json(raw)));
      expect(await getUsersPremiumInDb(289)).toEqual({ error: 'Некорректный ответ API аналитики' });
    });
  it('отклоняет неверные идентификаторы без сетевого запроса', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const projectId of [0, -1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(await getUsersPremiumInDb(projectId)).toHaveProperty('error');
    }
    expect(await getUsersPremiumInDb(289, { tokenId: 0 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('не раскрывает тело HTTP-ошибки и внутренние сетевые детали', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('database-secret', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await getUsersPremiumInDb(289)).toEqual({ error: 'Не удалось получить аналитику: HTTP 403' });
    fetchMock.mockImplementation(async () => { throw new Error('internal-token'); });
    expect(await getUsersPremiumInDb(289)).toEqual({ error: 'Не удалось получить аналитику из API приложения' });
  });
});

