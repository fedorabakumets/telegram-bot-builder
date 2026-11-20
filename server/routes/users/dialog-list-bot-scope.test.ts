/** @fileoverview Регрессия области бота в SQL групповых диалогов общего списка. */
import { describe, expect, it } from 'vitest';
import { buildGroupsSelectSql, groupChatTypesSql } from '../botUsers/dialogListKind';

describe('общий список групповых диалогов', () => {
  it('возвращает бота каждой переписки в позиции, совместимой с личными диалогами', () => {
    const sql = buildGroupsSelectSql(groupChatTypesSql('all'));
    expect(sql).toMatch(/bm\.chat_id AS "userId",\s*bm\.token_id AS "tokenId",\s*NULL AS "userName"/);
  });

  it('не объединяет историю одной группы в разных ботах', () => {
    const sql = buildGroupsSelectSql(groupChatTypesSql('groups'));
    const grouping = sql.match(/GROUP BY\s+([^;]+)/)?.[1] ?? '';
    expect(grouping.split(',').map(column => column.trim())).toEqual(
      expect.arrayContaining(['bm.chat_id', 'bm.token_id', 'bm.chat_type']),
    );
    expect(sql).toContain('($2::integer IS NULL OR bm.token_id = $2)');
    expect(sql).toContain("bm.chat_type IN ('group', 'supergroup')");
  });
});
