/** @fileoverview Проверки общей личной переписки: границы проекта, периода и области курсора. */
import { describe, expect, it } from 'vitest';
import { buildDialogSearchQuery, dialogSearchParams } from '../dialogs/message-search-query';
import { encodeMessageCursor } from '../dialogs/message-pagination';

/** Фильтры поиска одного человека во всех ботах проекта. */
const filters = { allBots: 'true', chatId: '123', chatType: 'private', query: 'скрыт_',
  messageFrom: '2026-11-05T04:00:00.000+03:00', messageTo: '2026-11-05T05:00:00.000+03:00' };

describe('Общий поиск личной переписки', () => {
  it('требует явную общую область и не разрешает группы либо смешанный токен', () => {
    expect(dialogSearchParams.safeParse(filters).success).toBe(true);
    for (const invalid of [{ ...filters, allBots: undefined }, { ...filters, tokenId: 11 },
      { ...filters, chatType: 'group', chatId: '-123' }, { ...filters, chatId: undefined }]) {
      expect(dialogSearchParams.safeParse(invalid).success).toBe(false);
    }
  });
  it('сохраняет изоляцию проекта, человека, типа чата и периода', () => {
    const query = buildDialogSearchQuery(13, dialogSearchParams.parse(filters));
    expect(query.sql).toContain('m.project_id = $1');
    expect(query.sql).toContain('($2::integer IS NULL OR m.token_id = $2)');
    expect(query.values).toEqual([13, null, '%скрыт\\_%', '123', 'private', filters.messageFrom, filters.messageTo, 11]);
    expect(query.sql).toContain("COALESCE(m.chat_type, 'private') = $5");
    expect(query.sql).toContain("m.created_at >= ($6::timestamptz AT TIME ZONE 'UTC')");
  });
  it('не переносит курсор общей ленты в другой проект, чат или отдельного бота', () => {
    const options = dialogSearchParams.parse(filters);
    const query = buildDialogSearchQuery(13, options);
    const cursor = encodeMessageCursor({ scope: query.scope, time: '2026-11-05T01:30:00.000Z', id: 42 });
    expect(() => buildDialogSearchQuery(13, { ...options, cursor })).not.toThrow();
    expect(() => buildDialogSearchQuery(14, { ...options, cursor })).toThrow();
    expect(() => buildDialogSearchQuery(13, { ...options, cursor, chatId: '456' })).toThrow();
    expect(() => buildDialogSearchQuery(13, { ...options, cursor, allBots: false, tokenId: 11 })).toThrow();
  });
});
