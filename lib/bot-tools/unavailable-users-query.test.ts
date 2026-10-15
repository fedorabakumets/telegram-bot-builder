/**
 * @fileoverview Проверка страницы удалённых и заблокировавших без базы.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { parseUnavailableKind, parseUnavailablePage, queryUnavailableUsers } from '../../server/routes/analytics/unavailable-users-query';

describe('недоступные пользователи', () => {
  /** Проверяет вид списка и границы страницы. */
  it('принимает both по умолчанию и отклоняет чужие числа', () => {
    expect(parseUnavailableKind(undefined)).toBe('both');
    expect(parseUnavailableKind('deleted')).toBe('deleted');
    expect(parseUnavailableKind('chats')).toBeNull();
    expect(parseUnavailablePage(undefined, undefined)).toEqual({ limit: 20, offset: 0 });
    expect(parseUnavailablePage('51', '0')).toBeNull();
    expect(parseUnavailablePage('10', '-1')).toBeNull();
  });

  /** Проверяет, что в запрос уходят проект, бот и вид, а пустая страница не врёт total. */
  it('читает страницу и общее число', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ userId: '5', userName: 'ann', firstName: 'Анна', lastName: null, isDeleted: true, isBlocked: false }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] });
    const page = await queryUnavailableUsers({ query } as unknown as Pool, 12, 9, 'deleted', 20, 0);
    expect(page).toMatchObject({ total: 3, hasMore: true, users: [{ userId: '5', isDeleted: true }] });
    expect(query.mock.calls[0][1]).toEqual([12, 9, 'deleted', 20, 0]);
    expect(query.mock.calls[1][1]).toEqual([12, 9, 'deleted']);
    expect(String(query.mock.calls[0][0])).toContain('is_bot');
  });
});
