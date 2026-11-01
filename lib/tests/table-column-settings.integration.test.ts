/** @fileoverview Проверка сохранения типов, атомарного импорта и валидации в PostgreSQL. */
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { columnSettings } from '../../shared/table-column-settings';
import { importBundleInProject } from '../../server/database/bot-tables/import-bundle';
import { loadColumnsInProject } from '../../server/database/bot-tables/load-scope';
import { applyCellEdits, TableEditError } from '../../server/database/bot-tables/apply-cell-edits';
import { importRowsInProject } from '../../server/database/bot-tables/import-rows';

test('Настройки не меняют внутреннее имя, а неверная ячейка откатывает весь импорт и диапазон', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = await pool.connect(); let projectId = 0;
  try {
    projectId = (await db.query("INSERT INTO bot_projects(name, data) VALUES ('Проверка типов таблиц', '{}'::jsonb) RETURNING id")).rows[0].id;
    const failed = await importBundleInProject(db, projectId, 'create', [
      { name: 'Первая', columns: ['title'], rows: [['Товар']] },
      { name: 'Вторая', columns: ['price'], columnSettings: [columnSettings({ dataType: 'number', min: 0 })], rows: [['Ошибка']] },
    ]);
    assert.equal(failed.ok, false);
    assert.equal(Number((await db.query('SELECT count(*) FROM bot_tables WHERE project_id=$1', [projectId])).rows[0].count), 0);
    const imported = await importBundleInProject(db, projectId, 'create', [
      { name: 'Товары', columns: ['price'], columnSettings: [columnSettings({ displayName: 'Цена в рублях', dataType: 'number', min: 0 })], rows: [['10']] },
    ]);
    assert.ok(imported.ok); if (!imported.ok) return;
    const tableId = imported.tables[0].tableId;
    const columns = await loadColumnsInProject(db, projectId, tableId);
    assert.equal(columns[0].name, 'price'); assert.equal(columns[0].settings?.displayName, 'Цена в рублях');
    const row = (await db.query('SELECT id FROM bot_table_rows WHERE table_id=$1', [tableId])).rows[0];
    await assert.rejects(() => applyCellEdits(db, projectId, tableId, [{ rowId: row.id, columnId: String(columns[0].id), before: '10', after: '-1' }]), (error) => error instanceof TableEditError && error.status === 400);
    const appended = await importRowsInProject(db, projectId, tableId, 'append', [{ [columns[0].id]: 'Нет числа' }]);
    assert.ok('status' in appended && appended.status === 400);
    assert.equal(Number((await db.query('SELECT count(*) FROM bot_table_rows WHERE table_id=$1', [tableId])).rows[0].count), 1);
    await applyCellEdits(db, projectId, tableId, [{ rowId: row.id, columnId: String(columns[0].id), before: '10', after: '12,5' }]);
    assert.equal((await db.query('SELECT data FROM bot_table_rows WHERE id=$1', [row.id])).rows[0].data[String(columns[0].id)], '12,5');
  } finally { if (projectId) await db.query('DELETE FROM bot_projects WHERE id=$1', [projectId]); db.release(); await pool.end(); }
});
