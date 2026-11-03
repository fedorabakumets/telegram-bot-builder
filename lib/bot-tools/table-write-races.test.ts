/** @fileoverview Регрессии дубликатов импорта и актуальных ограничений после блокировки. */
import { expect, it, vi } from 'vitest';
import { tableBundleSchema } from '../../shared/table-bundle-schema';
import { importBundleInProject } from '../../server/database/bot-tables/import-bundle';
import { importRowsInProject } from '../../server/database/bot-tables/import-rows';
import { patchRowLocked } from '../../server/database/bot-tables/patch-row-locked';
it('отклоняет совпадающие нормализованные колонки и таблицы до SQL', async () => {
  const table = { name: 'Товары', columns: ['A', ' A '], rows: [['первое', 'второе']] };
  expect(tableBundleSchema.safeParse({ tables: [table] }).success).toBe(false);
  const query = vi.fn();
  expect(await importBundleInProject({ query } as never, 7, 'replace', [table])).toHaveProperty('ok', false);
  const valid = { name: 'Товары', columns: ['A'], rows: [['первое']] };
  expect(tableBundleSchema.safeParse({ tables: [valid, { ...valid, name: ' Товары ' }] }).success).toBe(false);
  expect(await importBundleInProject({ query } as never, 7, 'replace', [valid, { ...valid, name: ' Товары ' }])).toHaveProperty('ok', false);
  expect(query).not.toHaveBeenCalled();
});
/**
 * Возвращает настройки, изменившиеся прямо перед получением блокировки.
 * @param missing - Таблица удалена перед получением блокировки.
 * @returns Изолированное соединение и история запросов.
 */
function changingSchema(missing = false) {
  let locked = false;
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('FOR UPDATE')) { locked = true; return { rows: missing ? [] : [{ id: 9 }] }; }
    if (sql.startsWith('SELECT c.id')) return { rows: [{ id: 4, table_id: 9, name: 'Цена', position: 0, settings: locked ? { dataType: 'number', min: 100 } : { dataType: 'text' } }] };
    return { rows: [] };
  });
  return { query };
}
it('импорт перечитывает ограничения после блокировки и не пишет недопустимые строки', async () => {
  const db = changingSchema();
  const result = await importRowsInProject(db as never, 7, 9, 'replace', [{ '4': '10' }]);
  expect(result).toHaveProperty('status', 400);
  const sql = db.query.mock.calls.map(([value]) => value);
  expect(sql.findIndex(value => value.includes('FOR UPDATE'))).toBeLessThan(sql.findIndex(value => value.startsWith('SELECT c.id')));
  expect(sql.at(-1)).toBe('ROLLBACK'); expect(sql.some(value => /^(INSERT|UPDATE|DELETE)/.test(value))).toBe(false);
});
it('legacy patch применяет актуальные ограничения в транзакции до UPDATE', async () => {
  const db = changingSchema();
  expect(await patchRowLocked(db as never, 7, 9, 11, { '4': '10' })).toHaveProperty('status', 400);
  const sql = db.query.mock.calls.map(([value]) => value);
  expect(sql.at(-1)).toBe('ROLLBACK'); expect(sql.some(value => value.startsWith('UPDATE'))).toBe(false);
  const missing = changingSchema(true);
  expect(await patchRowLocked(missing as never, 7, 9, 11, { '4': '100' })).toHaveProperty('status', 404);
  expect(missing.query.mock.calls.some(([value]) => value.startsWith('UPDATE'))).toBe(false);
});
