/**
 * @fileoverview Проверяет откат пакетного порядка проектов при нулевом UPDATE внутри транзакции.
 */
import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('../../server/database/db', () => ({ db: {} }));
import { DatabaseStorage } from '../../server/database/DatabaseStorage';
/** Формирует модель транзакционного хранилища и журнала блокировок. */
function model(failId?: number) {
 const orders = new Map([[1, 10], [2, 20]]); const events: string[] = [];
 const dialect = new PgDialect();
 const transaction = {
  select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ for: async () => { events.push('locked'); return [{ id: 1 }, { id: 2 }]; } }) }) }) }),
  update: () => ({ set: (values: { sortOrder: number }) => ({ where: (condition: any) => ({ returning: async () => {
   const id = Number(dialect.sqlToQuery(condition).params[0]); events.push(`write:${id}`);
   if (id === failId) return [];
   orders.set(id, values.sortOrder); return [{ id }];
  } }) }) }),
 };
 const db = { transaction: async (operation: (tx: typeof transaction) => unknown) => {
  const prior = new Map(orders);
  try { const result = await operation(transaction); events.push('commit'); return result; }
  catch (error) { orders.clear(); prior.forEach((value, key) => orders.set(key, value)); events.push('rollback'); throw error; }
 } };
 const storage = new DatabaseStorage(); Object.assign(storage, { db });
 return { storage, orders, events };
}
describe('атомарный порядок проектов', () => {
 it('откатывает первый UPDATE, если второй не изменил строку', async () => {
  const state = model(2); await expect(state.storage.reorderBotProjects([1, 2])).rejects.toThrow('запись проекта отсутствует');
  expect([...state.orders]).toEqual([[1, 10], [2, 20]]); expect(state.events).toEqual(['locked', 'write:1', 'write:2', 'rollback']);
 });
 it('фиксирует порядок только после блокировки всех проектов', async () => {
  const state = model(); await state.storage.reorderBotProjects([2, 1]);
  expect([...state.orders]).toEqual([[1, 1], [2, 0]]); expect(state.events).toEqual(['locked', 'write:2', 'write:1', 'commit']);
 });
});
