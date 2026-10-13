/** @fileoverview Проверки нормализации, охвата и безопасного чтения языков аудитории. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getUsersLanguagesInDb } from './users-languages-db.ts';
import { parseUsersLanguages } from './users-languages-read.ts';
import { runWithMcpToken } from './mcp-request-context.ts';

afterEach(() => vi.unstubAllGlobals());
describe('Языки аудитории', () => {
  it('передаёт бот и токен запроса, нормализует SQL и не меняет знаменатель процентов', async () => {
    /** Возвращает SQL-представление чисел для проверки защищённого запроса. */
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => Response.json({ languages: [
      { code: 'ru', count: '3', percentage: '30.0', private: 'secret' },
      { code: 'en', count: '2', percentage: '20.0' },
    ], sources: [{ param: 'secret' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await runWithMcpToken('request-token', () => getUsersLanguagesInDb(289, { tokenId: 18 }));
    expect(result).toMatchObject({ returned_users: 5, possibly_truncated: false,
      languages: [{ code: 'ru', count: 3, percentage: 30 }, { code: 'en', count: 2, percentage: 20 }] });
    expect(fetchMock.mock.calls[0][0]).toContain('/users/traffic?tokenId=18');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer request-token');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result).not.toHaveProperty('unknown_users');
  });
  it('допускает пустую выборку и отмечает возможное ограничение двадцатью строками', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ languages: [] })));
    expect(await getUsersLanguagesInDb(289)).toMatchObject({ languages: [], returned_users: 0 });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ languages: Array.from({ length: 20 }, (_, i) => ({ code: `lang${i}`, count: 1, percentage: '4.0' })) })));
    expect(await getUsersLanguagesInDb(289)).toMatchObject({ possibly_truncated: true, returned_users: 20 });
  });
  it.each([true, '', ' ', '1e2', '-1', 'Infinity', '0x10', '9'.repeat(33), Number.MAX_SAFE_INTEGER + 1])('отклоняет некорректный счётчик %s', count => {
    expect(() => parseUsersLanguages({ languages: [{ code: 'ru', count, percentage: 50 }] })).toThrow();
  });
  it.each([null, -1, 101, 'NaN', '50%'])('отклоняет некорректный процент %s', percentage => {
    expect(() => parseUsersLanguages({ languages: [{ code: 'ru', count: '1', percentage }] })).toThrow();
  });
  it('отклоняет дубли, чрезмерные строки, размер и небезопасную сумму', async () => {
    const row = { code: 'ru', count: 1, percentage: 1 };
    expect(() => parseUsersLanguages({ languages: [row, row] })).toThrow();
    expect(() => parseUsersLanguages({ languages: [{ ...row, code: 'a'.repeat(65) }] })).toThrow();
    expect(() => parseUsersLanguages({ languages: Array(21).fill(row) })).toThrow();
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ languages: [
      { ...row, count: Number.MAX_SAFE_INTEGER }, { ...row, code: 'en' },
    ] })));
    expect(await getUsersLanguagesInDb(289)).toHaveProperty('error');
  });
  it('отклоняет неверные идентификаторы до API и скрывает ошибки сервера и сети', async () => {
    const fetchMock = vi.fn(async () => new Response('secret-server-body', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await getUsersLanguagesInDb(0)).toHaveProperty('error');
    expect(await getUsersLanguagesInDb(289, { tokenId: 1.5 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await getUsersLanguagesInDb(289)).toEqual({ error: 'Не удалось получить аналитику: HTTP 403' });
    fetchMock.mockRejectedValue(new Error('private-host-token'));
    expect(JSON.stringify(await getUsersLanguagesInDb(289))).not.toContain('private-host-token');
  });
});
