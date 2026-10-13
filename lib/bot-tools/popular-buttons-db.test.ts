/**
 * @fileoverview Проверки фильтров, рейтинга и безопасного чтения популярных кнопок.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPopularButtonsInDb, parsePopularButtons } from './popular-buttons-db.ts';
import { runWithMcpToken } from './mcp-request-context.ts';

afterEach(() => vi.unstubAllGlobals());

describe('рейтинг популярных кнопок', () => {
  it('передаёт фильтры и токен запроса, считает только сумму топа', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json([
      { label: 'Далее', count: 8, secret: 'hidden' }, { label: 'Меню', count: 2 },
    ]));
    vi.stubGlobal('fetch', fetchMock);
    const result = await runWithMcpToken('request-pat', () => getPopularButtonsInDb(289, { tokenId: 3, period: '12w' }));
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:5000/api/projects/289/users/popular-buttons?granularity=7d&tokenId=3');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer request-pat');
    expect(result).toMatchObject({ returned_clicks: 10, window_seconds: 84 * 86400, limit: 10 });
    expect(JSON.stringify(result)).not.toContain('hidden');
    expect(result).not.toHaveProperty('total_clicks');
  });
  it('для всех ботов использует 30 дней по умолчанию и допускает пустые данные', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json([]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await getPopularButtonsInDb(289)).toMatchObject({ token_id: null, period: '30d', returned_clicks: 0, items: [] });
    expect(fetchMock.mock.calls[0][0]).toContain('granularity=1d');
    expect(fetchMock.mock.calls[0][0]).not.toContain('tokenId');
  });
  it.each(['1h', '3h', '24h', '7d', '30d', '12w', '12m'] as const)('поддерживает окно %s', async period => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([])));
    expect(await getPopularButtonsInDb(289, { period })).toMatchObject({ period });
  });
  it('не вызывает API при неверных фильтрах', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await getPopularButtonsInDb(0)).toHaveProperty('error');
    expect(await getPopularButtonsInDb(289, { tokenId: -1 })).toHaveProperty('error');
    expect(await getPopularButtonsInDb(289, { period: 'bad' as never })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404, 500])('скрывает тело HTTP %s', async status => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('secret-body', { status })));
    const result = await getPopularButtonsInDb(289);
    expect(result).toEqual({ error: `Не удалось получить аналитику: HTTP ${status}` });
    expect(JSON.stringify(result)).not.toContain('secret-body');
  });
  it('скрывает сетевые детали', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('private-host password'); }));
    expect(await getPopularButtonsInDb(289)).toEqual({ error: 'Не удалось получить аналитику из API приложения' });
  });
  it('отклоняет повреждённые и слишком большие рейтинги', () => {
    for (const raw of [null, {}, [{ label: null, count: 1 }], [{ label: 'a', count: '2' }],
      [{ label: 'a', count: -1 }], [{ label: 'a', count: 1.5 }], [{ label: 'a', count: Infinity }],
      [{ label: 'a'.repeat(1001), count: 1 }], [{ label: 'a', count: 1 }, { label: 'a', count: 2 }],
      Array.from({ length: 11 }, (_, index) => ({ label: String(index), count: 1 })),
      [{ label: 'a', count: Number.MAX_SAFE_INTEGER }, { label: 'b', count: 1 }]]) {
      expect(() => parsePopularButtons(raw)).toThrow('Некорректный ответ API аналитики');
    }
  });
});
