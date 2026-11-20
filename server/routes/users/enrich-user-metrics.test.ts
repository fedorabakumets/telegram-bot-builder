/** @fileoverview Проверки раздельных счётчиков и ограничения области пользователей. */
import { describe, expect, it, vi } from 'vitest';
import type { UserBotData } from '@shared/schema';
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
vi.mock('./user-bot-memberships', () => ({ userBotMemberships: async () => new Map() }));
import { enrichUserMetrics } from './enrich-user-metrics';

describe('Счётчики пользователей', () => {
  it('учитывает события аналитики и старые нажатия, ограничивая проект, бота и страницу', async () => {
    query.mockResolvedValueOnce({ rows: [{ user_id: '123', messages: 7, clicks: 3 }] })
      .mockResolvedValueOnce({ rows: [{ user_id: '123', label: 'Реклама' }] });
    const users = [{ userId: '123' }, { userId: '456' }] as UserBotData[];
    const result = await enrichUserMetrics(13, 9, users);
    expect(result.map(user => [user.incomingMessageCount, user.buttonClickCount])).toEqual([[7, 3], [0, 0]]);
    expect(result[0].acquisitionSource).toBe('Реклама');
    expect(query.mock.calls[0][1]).toEqual([13, 9, ['123', '456']]);
    expect(query.mock.calls[0][0]).toContain("kind='message_in'");
    expect(query.mock.calls[0][0]).toContain("reason='legacy_callback'");
    expect(query.mock.calls[0][0]).toContain("chat_type='private'");
  });
  it('не читает всю историю для пустой страницы', async () => {
    query.mockClear();
    expect(await enrichUserMetrics(13, null, [])).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});

/** Профильные сведения не исчезают при отсутствии строки аналитической аудитории. */
it('сохраняет общий источник и использует реквизиты контакта как запасной вариант', async () => {
  query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
  const users = [
    { userId: '1', acquisitionSource: 'Ссылка · общая' },
    { userId: '2', deepLinkParam: 'campaign' },
    { userId: '3', deepLinkParam: 'direct', referrerId: '42' },
    { userId: '4', deepLinkParam: 'direct' },
  ] as UserBotData[];
  expect((await enrichUserMetrics(13,null,users)).map(user => user.acquisitionSource)).toEqual([
    'Ссылка · общая','Ссылка · campaign','Приглашение · 42','Источник не сохранён',
  ]);
});
