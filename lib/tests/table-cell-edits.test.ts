/** @fileoverview Интеграционные проверки атомарного диапазона и связи контента с нодами. */
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { applyCellEdits, TableEditError } from '../../server/database/bot-tables/apply-cell-edits';
import { applyContentValue } from '../../server/services/content-table/apply-content-value';
import { extractContentFromNodes } from '../../server/services/content-table/content-key-parser';

/** Исходный сценарий с отдельной нодой клавиатуры. */
const scenario = { sheets: [{ name: 'Главная', nodes: [
  { id: 'message', type: 'message', data: { messageText: 'Первый текст', keyboardNodeId: 'keyboard' } },
  { id: 'keyboard', type: 'keyboard', data: { buttons: [{ id: 'buy', text: 'Купить', url: 'https://example.com' }] } },
] }] };

test('Массовая операция сохраняет таблицу и сценарий согласованно и откатывается целиком при конфликте', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  let projectId = 0;
  try {
    const project = await client.query("INSERT INTO bot_projects(name, data) VALUES ('Проверка атомарных таблиц', $1::jsonb) RETURNING id", [JSON.stringify(scenario)]);
    projectId = project.rows[0].id;
    const table = await client.query("INSERT INTO bot_tables(project_id, name) VALUES ($1, '_content') RETURNING id", [projectId]);
    const tableId = table.rows[0].id;
    const columns = new Map<string, string>();
    for (const [position, name] of ['key', 'type', 'sheet', 'value'].entries()) {
      const result = await client.query('INSERT INTO bot_table_columns(table_id, name, position) VALUES ($1, $2, $3) RETURNING id', [tableId, name, position]);
      columns.set(name, String(result.rows[0].id));
    }
    const entries = extractContentFromNodes(scenario.sheets);
    const rows = new Map<string, number>();
    for (const [index, entry] of entries.entries()) {
      const data = Object.fromEntries(Object.entries(entry).map(([name, value]) => [columns.get(name), value]));
      const row = await client.query('INSERT INTO bot_table_rows(table_id, row_index, data) VALUES ($1, $2, $3::jsonb) RETURNING id', [tableId, index, JSON.stringify(data)]);
      rows.set(entry.key, row.rows[0].id);
    }
    const valueId = columns.get('value')!;
    const changes = [
      { rowId: rows.get('message')!, columnId: valueId, before: 'Первый текст', after: 'Новый текст' },
      { rowId: rows.get('message.btn.buy')!, columnId: valueId, before: 'Купить', after: 'Открыть каталог' },
    ];
    await applyCellEdits(client, projectId, tableId, changes);
    const saved = (await client.query('SELECT data FROM bot_projects WHERE id = $1', [projectId])).rows[0].data;
    const regenerated = extractContentFromNodes(saved.sheets);
    assert.equal(regenerated.find((entry) => entry.key === 'message')?.value, 'Новый текст');
    assert.equal(regenerated.find((entry) => entry.key === 'message.btn.buy')?.value, 'Открыть каталог');
    assert.equal(saved.sheets[0].nodes[1].data.buttons[0].text, 'Открыть каталог');
    await assert.rejects(() => applyCellEdits(client, projectId, tableId, [
      { ...changes[0], before: 'Новый текст', after: 'Не должно сохраниться' },
      { ...changes[1], before: 'Устаревшее значение', after: 'Тоже не сохранять' },
    ]), (error) => error instanceof TableEditError && error.status === 409);
    const unchanged = (await client.query('SELECT data FROM bot_table_rows WHERE id = $1', [changes[0].rowId])).rows[0].data;
    assert.equal(unchanged[valueId], 'Новый текст');
    await applyCellEdits(client, projectId, tableId, changes.map((edit) => ({ ...edit, before: edit.after, after: edit.before })));
    const undone = (await client.query('SELECT data FROM bot_projects WHERE id = $1', [projectId])).rows[0].data;
    assert.equal(undone.sheets[0].nodes[0].data.messageText, 'Первый текст');
    assert.equal(undone.sheets[0].nodes[1].data.buttons[0].text, 'Купить');
    await client.query("UPDATE bot_projects SET data = jsonb_set(data, '{sheets,0,nodes,0,data,messageText}', $2::jsonb) WHERE id = $1", [projectId, JSON.stringify('Свежее изменение сценария')]);
    await assert.rejects(() => applyCellEdits(client, projectId, tableId, [changes[0]]), (error) => error instanceof TableEditError && error.status === 409);
    await assert.rejects(() => applyCellEdits(client, projectId + 1, tableId, [changes[1]]), (error) => error instanceof TableEditError && error.status === 404);
  } finally {
    if (projectId) await client.query('DELETE FROM bot_projects WHERE id = $1', [projectId]);
    client.release(); await pool.end();
  }
});

test('Синхронизация сохраняет ID с точками и совпадающими суффиксами', () => {
  const data = { sheets: [{ nodes: [
    { id: 'node.desc.part', data: { messageText: 'Исходное', buttons: [{ id: 'buy', text: 'Купить' }] } },
  ] }] };
  assert.equal(applyContentValue(data, 'node.desc.part.btn.buy', 'button', 'Открыть'), true);
  assert.equal(data.sheets[0].nodes[0].data.buttons[0].text, 'Открыть');
  assert.equal(applyContentValue(data, 'node.desc.part', 'message', 'Новое'), true);
  assert.equal(data.sheets[0].nodes[0].data.messageText, 'Новое');
  assert.equal(applyContentValue(data, 'missing.btn.buy', 'button', 'Нет'), false);
});
