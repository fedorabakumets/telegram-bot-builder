/**
 * @fileoverview Проверяет транзакцию синхронизации актуального контента без рабочей БД.
 */
import { describe, expect, it, vi } from 'vitest';
const poolMock = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock('../../server/database/db', () => ({ pool: poolMock }));
import { syncContentToTable } from '../../server/services/content-table/sync-content-to-table';
import { syncCurrentProjectContent } from '../../server/services/content-table/sync-current-project-content';
/** Создаёт SQL-заглушку с актуальным снимком и состоянием контента. */
function database() {
 const commands: string[] = []; let value = 'старая';
 const connection = { query: vi.fn(async (sql: string, args?: readonly unknown[]) => {
  commands.push(sql);
  if (sql.startsWith('SELECT data, revision')) return { rows: [{ revision: 12, data: { sheets: [{ id: 's', name: 'Лист', nodes: [{ id: 'm', type: 'message', data: { messageText: 'актуальная' } }] }] } }], rowCount: 1 };
  if (sql.startsWith('SELECT id FROM bot_tables')) return { rows: [{ id: 2 }], rowCount: 1 };
  if (sql.startsWith('SELECT id, name')) return { rows: ['key', 'type', 'sheet', 'value'].map((name, index) => ({ id: index + 1, name })), rowCount: 4 };
  if (sql.startsWith('SELECT id, row_index')) return { rows: [{ id: 3, row_index: 0, data: { '1': 'm', '2': 'text', '3': 'Лист', '4': value } }], rowCount: 1 };
  if (sql.startsWith('UPDATE bot_table_rows')) value = JSON.parse(String(args?.[1]))['4'];
  return { rows: [], rowCount: 0 };
 }) };
 return { connection, commands, value: () => value };
}
describe('актуальный контент под PostgreSQL lock', () => {
 it('всегда перечитывает revision под FOR UPDATE и держит lock до COMMIT', async () => {
  const db = database();
  expect(await syncCurrentProjectContent(db.connection as never, 1)).toBe(12);
  expect(await syncCurrentProjectContent(db.connection as never, 1)).toBe(12);
  expect(db.value()).toBe('актуальная');
  expect(db.commands[0]).toBe('BEGIN'); expect(db.commands[1]).toContain('FOR UPDATE');
  expect(db.commands.at(-1)).toBe('COMMIT');
  expect(db.commands.filter((sql) => sql.startsWith('SELECT data, revision'))).toHaveLength(2);
 });
 it('запоздалый postcommit старой revision не возвращает старый контент', async () => {
  const db = database(); const release = vi.fn();
  poolMock.connect.mockResolvedValue({ ...db.connection, release });
  await syncContentToTable(1, { revision: 12, sheets: [] });
  await syncContentToTable(1, { revision: 11, sheets: [{ nodes: [{ id: 'm', data: { messageText: 'старая' } }] }] });
  expect(db.value()).toBe('актуальная'); expect(release).toHaveBeenCalledTimes(2);
  expect(db.commands.filter((sql) => sql.startsWith('SELECT data, revision'))).toHaveLength(2);
 });
 it('не допускает частичной синхронизации при ошибке записи', async () => {
  const db = database(); const query = db.connection.query;
  db.connection.query = vi.fn(async (sql, args) => { if (sql.startsWith('UPDATE bot_table_rows')) throw new Error('write error'); return query(sql, args); });
  await expect(syncCurrentProjectContent(db.connection as never, 1)).rejects.toThrow('write error');
  expect(db.commands.at(-1)).toBe('ROLLBACK'); expect(db.commands).not.toContain('COMMIT');
 });
});
