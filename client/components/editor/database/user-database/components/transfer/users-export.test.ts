/** @fileoverview Проверки полноты выгрузки, фильтров, отмены и защиты от неполных файлов. */
import { afterEach, expect, it, vi } from 'vitest';
import { exportUsers } from './users-export';

/** Возвращает ответ страницы без обращения к сети. @param value - Содержимое страницы. @returns Ответ сервера. */
function response(value: unknown) { return { ok: true, json: async () => value }; }
/** Восстанавливает сеть после каждой независимой проверки. */
afterEach(() => vi.unstubAllGlobals());

/** Все страницы используют область и фильтры, а повтор человека не создаёт вторую запись. */
it('сохраняет фильтры на всех страницах и удаляет повторы людей', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response({ users: [{ userId: '1' }, { userId: '2' }], total: 3, hasMore: true }))
    .mockResolvedValueOnce(response({ users: [{ userId: '2' }, { userId: '3' }], total: 3, hasMore: false }));
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  const query = { search: 'Иван', source: 'Меню', status: 'active', premium: 'true', filters: '{"messagesMin":1}',
    sortBy: 'firstName', sortDir: 'asc', limit: '1', offset: '999', dialogKind: 'groups' };
  const users = await exportUsers({ projectId: 12, tokenId: 9, query, signal });
  expect(users.map(user => user.userId)).toEqual(['1', '2', '3']);
  for (const [url, options] of fetcher.mock.calls) {
    const params = new URL(url, 'http://localhost').searchParams;
    expect(params.get('search')).toBe('Иван');
    expect(params.get('source')).toBe('Меню');
    expect(params.get('filters')).toBe(query.filters);
    expect(params.get('status')).toBe('active');
    expect(params.get('premium')).toBe('true');
    expect(params.get('sortBy')).toBe('firstName');
    expect(params.get('sortDir')).toBe('asc');
    expect(params.get('tokenId')).toBe('9');
    expect(params.get('privateContactsOnly')).toBe('true');
    expect(params.get('limit')).toBe('200');
    expect(params.has('dialogKind')).toBe(false);
    expect(options.signal).toBe(signal);
  }
  expect(new URL(fetcher.mock.calls[1][0], 'http://localhost').searchParams.get('offset')).toBe('2');
});

/** Слишком большая аудитория не выдаётся пользователю как успешный неполный экспорт. */
it('отказывает при превышении предела, сохраняя возможность сузить фильтры', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ users: [], total: 50_001, hasMore: true })));
  await expect(exportUsers({ projectId: 12, query: {}, signal: new AbortController().signal })).rejects.toThrow('50 000');
});

/** Отменённая операция не начинает загрузку и не возвращает накопленный результат. */
it('не запрашивает страницы после отмены', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  controller.abort();
  await expect(exportUsers({ projectId: 12, query: {}, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetcher).not.toHaveBeenCalled();
});

/** Пустая страница с обещанием продолжения не создаёт бесконечный цикл запросов. */
it('останавливается при некорректном продолжении пагинации', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ users: [], total: 1, hasMore: true })));
  await expect(exportUsers({ projectId: 12, query: {}, signal: new AbortController().signal })).rejects.toThrow('следующую страницу');
});
