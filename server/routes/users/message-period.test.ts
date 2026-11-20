/** @fileoverview Проверки времени сообщений, изоляции переписок и поиска в том же периоде. */
import { describe, expect, it } from 'vitest';
import { messagePeriodSchema } from '../../../shared/message-period';
import { advancedUserFiltersSchema } from '../../../shared/user-advanced-filters';
import { userMessagePeriodSql } from './user-message-period-sql';
import { buildDialogSearchQuery, dialogSearchParams } from '../dialogs/message-search-query';

const period = { messageFrom: '2026-11-05T04:00:00.000+03:00', messageTo: '2026-11-05T04:04:59.999+03:00' };
describe('Период сообщений с временем', () => {
  it('проверяет порядок по моментам времени с учётом часового пояса', () => {
    expect(messagePeriodSchema.safeParse(period).success).toBe(true);
    expect(advancedUserFiltersSchema.safeParse(period).success).toBe(true);
    expect(messagePeriodSchema.safeParse({ messageFrom: period.messageTo, messageTo: period.messageFrom }).success).toBe(false);
    expect(messagePeriodSchema.safeParse({ messageFrom: '2026-11-05T04:00' }).success).toBe(false);
  });
  it('привязывает сообщение к проекту, боту, человеку и границам UTC', () => {
    const params: unknown[] = [13, 11];
    const sql = userMessagePeriodSql(period, params, 'скрыт_');
    expect(sql).toContain('bm.project_id=u.project_id');
    expect(sql).toContain('bm.token_id=u.token_id');
    expect(sql).toContain("COALESCE(bm.chat_type,'private')='private'");
    expect(sql).toContain("bm.created_at >= ($3::timestamptz AT TIME ZONE 'UTC')");
    expect(sql).toContain("bm.created_at <= ($4::timestamptz AT TIME ZONE 'UTC')");
    expect(sql).toContain('bm.message_text ILIKE $5');
    expect(params).toEqual([13, 11, period.messageFrom, period.messageTo, '%скрыт\\_%']);
    expect(sql).not.toContain('скрыт');
  });
  it('разрешает период без слова и применяет обе границы к совпадениям', () => {
    expect(dialogSearchParams.safeParse({ tokenId: 11 }).success).toBe(false);
    const options = dialogSearchParams.parse({ tokenId: 11, chatId: '123', chatType: 'private', ...period });
    const query = buildDialogSearchQuery(13, options);
    expect(query.values).toEqual([13, 11, '%%', '123', 'private', period.messageFrom, period.messageTo, 11]);
    expect(query.sql).toContain("m.created_at >= ($6::timestamptz AT TIME ZONE 'UTC')");
    expect(query.sql).toContain("m.created_at <= ($7::timestamptz AT TIME ZONE 'UTC')");
    expect(userMessagePeriodSql({}, [])).toBe('');
  });
});
