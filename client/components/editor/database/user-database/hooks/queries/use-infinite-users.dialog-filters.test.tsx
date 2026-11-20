/** @fileoverview Проверки подключения фильтров профиля к личным диалогам без изменения групп, сортировки и кэша. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useInfiniteUsers } from './use-infinite-users';
/** Перехваченные зависимости не создают запросов React Query или настоящего сетевого соединения. */
const mocks = vi.hoisted(() => ({ infinite: vi.fn(), controls: vi.fn(), fetch: vi.fn(), setResult: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useInfiniteQuery: mocks.infinite }));
vi.mock('../../content/user-directory-controls', () => ({ useDirectoryControls: mocks.controls }));
/** Данные провайдера намеренно содержат сортировку пользователей, отличную от сортировки диалогов. */
const controls = { source: 'Реклама', status: 'blocked', premium: 'true', field: 'acquisitionSource', direction: 'asc',
  advanced: { language: 'ru', lastActiveFrom: '2026-11-01', variableName: 'city', variableMode: 'filled', bots: 'multiple' }, setResult: mocks.setResult };
/** Снимок первой страницы содержит все фасеты без загрузки дополнительных страниц. */
const page = { users: [], total: 4, hasMore: false, sourceCounts: { Реклама: 4 }, statusCounts: { all: 4, blocked: 4 },
  premiumCounts: { all: 4, true: 4, false: 0 }, languageCounts: { ru: 4 } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.controls.mockReturnValue(controls);
  mocks.infinite.mockReturnValue({ data: { pages: [page] }, fetchNextPage: vi.fn(), hasNextPage: false,
    isFetchingNextPage: false, isLoading: false, error: null, refetch: vi.fn() });
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => page });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
/** Возвращает параметры последнего вызова запроса и исполняет его вручную. @returns URL серверного запроса. */
async function requestedUrl() {
  const options = mocks.infinite.mock.lastCall![0];
  await options.queryFn({ pageParam: 50 });
  return new URL(mocks.fetch.mock.lastCall![0], 'http://localhost');
}
it.each(['all', 'users'] as const)('подключает фильтры к личным диалогам в режиме %s без подмены области пользователей', async kind => {
  renderHook(() => useInfiniteUsers({ projectId: 12, selectedTokenId: 9, dialogKind: kind, dialogUserFilters: true,
    search: 'текст сообщения', sortBy: 'lastInteraction', sortDir: 'desc' }));
  const query = (await requestedUrl()).searchParams;
  expect(query.get('dialogUserFilters')).toBe('true');
  expect(query.get('dialogKind')).toBe(kind);
  expect(query.get('privateContactsOnly')).toBeNull();
  expect(query.get('source')).toBe('Реклама'); expect(query.get('status')).toBe('blocked'); expect(query.get('premium')).toBe('true');
  expect(query.get('sortBy')).toBe('lastInteraction'); expect(query.get('sortDir')).toBe('desc');
  expect(query.get('search')).toBe('текст сообщения'); expect(query.get('offset')).toBe('50');
  expect(JSON.parse(query.get('filters')!)).toEqual({ language: 'ru', lastActiveFrom: '2026-11-01', variableName: 'city', variableMode: 'filled' });
  expect(mocks.fetch.mock.lastCall![1]).toEqual({ credentials: 'include' });
});
it.each(['groups', 'channels'] as const)('сохраняет состояние, но не посылает профильные условия для %s', async kind => {
  renderHook(() => useInfiniteUsers({ projectId: 12, selectedTokenId: 9, dialogKind: kind, dialogUserFilters: true,
    sortBy: 'lastInteraction', sortDir: 'desc' }));
  const query = (await requestedUrl()).searchParams;
  expect(query.get('dialogUserFilters')).toBe('true'); expect(query.get('dialogKind')).toBe(kind);
  for (const key of ['source', 'status', 'premium', 'filters', 'privateContactsOnly']) expect(query.get(key)).toBeNull();
  expect(controls.source).toBe('Реклама'); expect(controls.advanced.language).toBe('ru');
});
/** Нейтральные фильтры тоже имеют отдельный кэш при явном включении режима диалогов. */
it('различает режимы кэша и не меняет прежние диалоги без явного подключения', async () => {
  mocks.controls.mockReturnValue({ source: '', status: 'all', premium: 'all', advanced: {}, setResult: mocks.setResult });
  const view = renderHook(({ enabled }) => useInfiniteUsers({ projectId: 12, selectedTokenId: 9, dialogKind: 'all',
    dialogUserFilters: enabled, sortBy: 'lastInteraction', sortDir: 'desc' }), { initialProps: { enabled: false } });
  const before = mocks.infinite.mock.lastCall![0].queryKey;
  expect((await requestedUrl()).searchParams.get('dialogUserFilters')).toBeNull();
  view.rerender({ enabled: true });
  expect(mocks.infinite.mock.lastCall![0].queryKey).not.toEqual(before);
  expect((await requestedUrl()).searchParams.get('dialogUserFilters')).toBe('true');
});
/** Фильтры фасетов используют итог первого серверного снимка, а не количество загруженных строк. */
it('передаёт фасеты в провайдер и сохраняет фильтр количества ботов в общей области', async () => {
  renderHook(() => useInfiniteUsers({ projectId: 12, selectedTokenId: null, dialogKind: 'users', dialogUserFilters: true }));
  expect(mocks.setResult).toHaveBeenCalledWith({ total: 4, sourceCounts: page.sourceCounts, statusCounts: page.statusCounts,
    premiumCounts: page.premiumCounts, languageCounts: page.languageCounts });
  expect(JSON.parse((await requestedUrl()).searchParams.get('filters')!).bots).toBe('multiple');
});
/** Панель пользователей продолжает применять свою сортировку и прежний маркер области. */
it('сохраняет прежние фильтры пользователей при privateContactsOnly', async () => {
  renderHook(() => useInfiniteUsers({ projectId: 12, selectedTokenId: 9, privateContactsOnly: true, sortBy: 'lastInteraction', sortDir: 'desc' }));
  const query = (await requestedUrl()).searchParams;
  expect(query.get('privateContactsOnly')).toBe('true'); expect(query.get('dialogUserFilters')).toBeNull();
  expect(query.get('sortBy')).toBe('acquisitionSource'); expect(query.get('sortDir')).toBe('asc');
  expect(query.get('source')).toBe('Реклама');
});
