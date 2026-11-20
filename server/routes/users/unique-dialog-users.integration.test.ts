/** @fileoverview Проверка объединения диалогов до пагинации и после фильтрации в PostgreSQL. */
import { beforeAll, afterAll, it, expect } from 'vitest';
import { createAnalyticsTestDatabase } from '../analytics/v2/test-database';
import { uniqueDialogUsersSql } from '../dialogs/unique-dialog-users-sql';

/** Изолированная схема тестовой базы без изменения рабочих данных. */
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
/** Два бота одного человека и самостоятельная переписка другого. */
const selection = `SELECT * FROM (VALUES
  ('101',11,'2026-11-01T12:00Z'::timestamptz,'older',true),
  ('101',12,'2026-11-02T12:00Z'::timestamptz,'newer',false),
  ('102',11,'2026-11-03T12:00Z'::timestamptz,'second',true)
) rows("userId","tokenId","lastInteraction","text","allowed")`;

it('возвращает одного человека один раз и выбирает его последнее сообщение', async () => {
  const result = await database.pool.query(`${uniqueDialogUsersSql(selection)} ORDER BY "lastInteraction" DESC`);
  expect(result.rows.map(row => [row.userId, row.tokenId, row.text])).toEqual([
    ['102', 11, 'second'], ['101', 12, 'newer'],
  ]);
});

it('применяет фильтр до выбора переписки и не теряет подходящий старый бот', async () => {
  const result = await database.pool.query(uniqueDialogUsersSql(`${selection} WHERE "allowed"`));
  expect(result.rows.find(row => row.userId === '101')).toMatchObject({ tokenId: 11, text: 'older' });
});

it('считает людей до LIMIT и возвращает разные страницы без повторов', async () => {
  const sql = uniqueDialogUsersSql(selection);
  const count = await database.pool.query(`SELECT COUNT(*)::integer total FROM (${sql}) counted`);
  const pages = await Promise.all([0, 1].map(offset => database.pool.query(
    `${sql} ORDER BY "lastInteraction" DESC, "userId" LIMIT 1 OFFSET $1`, [offset],
  )));
  expect(count.rows[0].total).toBe(2);
  expect(pages.map(page => page.rows[0].userId)).toEqual(['102', '101']);
});

it('оставляет групповые строки отдельными при объединении списков', async () => {
  const sql = uniqueDialogUsersSql(selection);
  const result = await database.pool.query(`${sql} UNION ALL SELECT '-10',11,now(),'group',true
    UNION ALL SELECT '-10',12,now(),'group',true`);
  expect(result.rows).toHaveLength(4);
  expect(result.rows.filter(row => row.userId === '-10').map(row => row.tokenId)).toEqual([11, 12]);
});
