/** @fileoverview Проверка списка реальных ботов одного собеседника без смешивания групп. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
import { enrichDialogBotMemberships } from '../dialogs/enrich-dialog-bots';

describe('боты собеседника в общем списке диалогов', () => {
  beforeEach(() => { query.mockReset(); });

  it('сохраняет одного человека и несколько его ботов с отдельными статусами', async () => {
    query.mockResolvedValueOnce({ rows: [
      { userId: '123', membership: { tokenId: 9, isBlocked: false }, authorizationError: null, botActive: 1 },
      { userId: '123', membership: { tokenId: 10, isBlocked: true }, authorizationError: 'telegram_frozen', botActive: 1 },
    ] });
    const group = { userId: '-1004', tokenId: 9, isGroup: true };
    const result = await enrichDialogBotMemberships(12, [{ userId: '123' }, group]);
    expect(result).toHaveLength(2);
    expect(result[0].botMemberships?.map(bot => [bot.tokenId, bot.isBlocked, bot.botAvailability])).toEqual([
      [9, false, null], [10, true, 'Бот заморожен Telegram'],
    ]);
    expect(result[1]).toBe(group);
    expect(query.mock.calls[0][1]).toEqual([12, ['123']]);
    expect(query.mock.calls[0][0]).toContain("COALESCE(m.chat_type,'private')='private'");
    expect(query.mock.calls[0][0]).toContain('t.project_id=$1');
  });

  it('не читает историю для пустой страницы или только групп', async () => {
    expect(await enrichDialogBotMemberships(12, [])).toEqual([]);
    const groups = [{ userId: '-1004', isGroup: true }];
    expect(await enrichDialogBotMemberships(12, groups)).toBe(groups);
    expect(query).not.toHaveBeenCalled();
  });
});
