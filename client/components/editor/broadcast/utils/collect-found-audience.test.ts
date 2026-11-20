/** @fileoverview Проверки полной пагинации, фильтров и отказа при неоднозначном списке получателей. */
import { beforeEach, expect, it, vi } from 'vitest';
import { collectFoundAudience, type FoundAudienceScope } from './collect-found-audience';

const scope: FoundAudienceScope = { projectId: 13, tokenId: 11, audience: 'dialogs', search: 'скрыто',
  source: 'Источник', status: 'all', premium: 'true', advanced: { messageFrom: '2026-11-05T04:04:00.000+03:00' } };
beforeEach(() => vi.mocked(fetch).mockReset());
/** Возвращает страницу, не подключая сервер и Telegram. */
function page(users: string[], total: number, hasMore: boolean) {
  return { ok: true, json: async () => ({ users: users.map(userId => ({ userId })), total, hasMore }) } as Response;
}
it('забирает все страницы и переносит фильтры, включая период', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(page(['1', '2'], 3, true)).mockResolvedValueOnce(page(['3'], 3, false));
  expect(await collectFoundAudience(scope)).toEqual(['1', '2', '3']);
  const url = new URL(String(vi.mocked(fetch).mock.calls[1][0]), 'http://localhost');
  expect(url.searchParams.get('offset')).toBe('2');
  expect(url.searchParams.get('dialogKind')).toBe('users');
  expect(url.searchParams.get('search')).toBe('скрыто');
  expect(url.searchParams.get('source')).toBe('Источник');
  expect(JSON.parse(url.searchParams.get('filters')!)).toEqual(scope.advanced);
});
it('не открывает отправку всем при пустом результате или сбое страницы', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(page([], 0, false));
  await expect(collectFoundAudience(scope)).rejects.toThrow('не найдено');
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
  await expect(collectFoundAudience(scope)).rejects.toThrow('Не удалось собрать');
});
it('отклоняет изменение количества, превышение лимита и групповой ID', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(page(['1'], 2, true)).mockResolvedValueOnce(page(['2'], 3, false));
  await expect(collectFoundAudience(scope)).rejects.toThrow('изменились');
  vi.mocked(fetch).mockResolvedValueOnce(page(['1'], 10001, true));
  await expect(collectFoundAudience(scope)).rejects.toThrow('10 000');
  vi.mocked(fetch).mockResolvedValueOnce(page(['-1001'], 1, false));
  await expect(collectFoundAudience(scope)).rejects.toThrow('неподходящий');
});
it('применяет область пользователей отдельно от диалогов', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(page(['1'], 1, false));
  await collectFoundAudience({ ...scope, audience: 'users' });
  const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]), 'http://localhost');
  expect(url.searchParams.get('privateContactsOnly')).toBe('true');
  expect(url.searchParams.has('dialogKind')).toBe(false);
});
