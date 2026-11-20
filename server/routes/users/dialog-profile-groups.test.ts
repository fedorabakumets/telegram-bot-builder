/** @fileoverview Проверка ограничений проекта и раздельных доказательств групп пользователя. */
import { beforeEach, expect, it, vi } from 'vitest';
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
import { DIALOG_PROFILE_GROUPS_SQL, getDialogProfileGroups } from '../dialogs/dialog-profile-groups-store';

beforeEach(() => { query.mockReset(); });

it('не выдаёт сохранённую активность за известное членство', async () => {
  const groups = [
    { groupId: '-1001', tokenId: 9, membershipKnown: true, membershipStatus: 'left', messageCount: 0 },
    { groupId: '-1002', tokenId: 10, membershipKnown: false, membershipStatus: null, messageCount: 3 },
  ];
  query.mockResolvedValueOnce({ rows: groups });
  expect(await getDialogProfileGroups(12, '123')).toEqual(groups);
  expect(query).toHaveBeenCalledWith(DIALOG_PROFILE_GROUPS_SQL, [12, '123']);
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain('m.group_id IS NOT NULL membership_known');
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain("bm.message_type='user'");
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain('m.token_id IS NOT DISTINCT FROM a.token_id');
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain('bg.project_id=$1 AND gm.user_id::text=$2');
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain('bm.project_id=$1 AND bm.user_id=$2');
  expect(DIALOG_PROFILE_GROUPS_SQL).toContain('t.project_id=$1');
  expect(DIALOG_PROFILE_GROUPS_SQL).not.toContain('t.token');
});
