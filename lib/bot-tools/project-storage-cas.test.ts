/**
 * @fileoverview Проверяет настоящий SQL записи проекта через изолированный Drizzle-драйвер.
 */
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ query: '', params: [] as unknown[], rows: [] as unknown[][][] }));
vi.mock('../../server/database/db', async () => {
 const { drizzle: create } = await import('drizzle-orm/pg-proxy');
 return { db: create(async (query, params) => { state.query = query; state.params = params; return { rows: state.rows.shift() ?? [] }; }) };

});
import { DatabaseStorage } from '../../server/database/DatabaseStorage';
describe('атомарный SQL revision CAS', () => {
 it('сравнивает revision в том же UPDATE и увеличивает её SQL выражением', async () => {
  const storage = new DatabaseStorage();
  expect(await storage.updateBotProject(1, { data: {}, revision: 999 }, 7)).toBeUndefined();
  expect(state.query).toMatch(/"revision" = "bot_projects"\."revision" \+ 1/);
  expect(state.query).toMatch(/where \("bot_projects"\."id" = \$\d+ and "bot_projects"\."revision" = \$\d+\)/);
  expect(state.params.slice(-2)).toEqual([1, 7]);
  expect(state.params).not.toContain(999);
 });
 it('старый клиент без токена также увеличивает ревизию', async () => {
  await new DatabaseStorage().updateBotProject(1, { name: 'Новое' });
  expect(state.query).toMatch(/"revision" = "bot_projects"\."revision" \+ 1/);
  expect(state.params.at(-1)).toBe(1);
 });
 it('очистка версий возвращает реально удалённые строки, а не плановый размер', async () => {
  state.rows = [[[10], [11]], [[10]]];
  expect(await new DatabaseStorage().deleteProjectVersionsBulk(1, {})).toBe(1);
  expect(state.query).toContain('returning "id"');
 });
});
