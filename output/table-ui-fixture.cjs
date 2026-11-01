/** @fileoverview Временный проект для проверки интерфейса таблиц без изменения пользовательских данных. */
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const filename = 'output/table-ui-fixture.json';
/** Создаёт отдельный проект с контентом и пользовательской таблицей. */
async function create() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const source = (await client.query('SELECT data FROM bot_projects WHERE id = 9')).rows[0].data;
    const template = source.sheets[0].nodes.find(node => node.type === 'message')?.data ?? {};
    const data = { sheets: [{ id: 'qa-sheet', name: 'Проверка', nodes: [
      { id: 'qa-message', type: 'message', position: { x: 100, y: 100 }, data: { ...template, label: 'Приветствие тест', messageText: 'Первый текст', keyboardNodeId: 'qa-keyboard', buttons: [] } },
      { id: 'qa-keyboard', type: 'keyboard', position: { x: 500, y: 100 }, data: { ...template, label: 'Клавиатура тест', messageText: '', buttons: [{ id: 'qa-button', text: 'Открыть', action: 'goto', target: 'qa-message' }] } },
    ], connections: [] }], activeSheetId: 'qa-sheet' };
    const project = (await client.query("INSERT INTO bot_projects(owner_id, name, data) SELECT owner_id, 'QA таблицы временный проект', $1::jsonb FROM bot_projects WHERE id = 9 RETURNING id", [JSON.stringify(data)])).rows[0];
    const result = { projectId: project.id, tables: [] };
    for (const spec of [
      { name: '_content', columns: ['key', 'type', 'sheet', 'value'], rows: [['qa-message', 'message', 'Проверка', 'Первый текст'], ['qa-message.btn.qa-button', 'button', 'Проверка', 'Открыть']] },
      { name: 'QA данные', columns: ['Название', 'Цена'], rows: [['Первый товар', '10'], ['Второй товар', '20'], ['Третий товар', '30']] },
    ]) {
      const table = (await client.query('INSERT INTO bot_tables(project_id, name) VALUES ($1, $2) RETURNING id', [project.id, spec.name])).rows[0];
      const columns = [];
      for (const [index, name] of spec.columns.entries()) columns.push((await client.query('INSERT INTO bot_table_columns(table_id, name, position) VALUES ($1, $2, $3) RETURNING id, name', [table.id, name, index])).rows[0]);
      const rows = [];
      for (const [index, values] of spec.rows.entries()) rows.push((await client.query('INSERT INTO bot_table_rows(table_id, row_index, data) VALUES ($1, $2, $3::jsonb) RETURNING id', [table.id, index + 1, JSON.stringify(Object.fromEntries(columns.map((col, ci) => [col.id, values[ci]])))])).rows[0]);
      result.tables.push({ ...table, name: spec.name, columns, rows });
    }
    await client.query('COMMIT'); fs.writeFileSync(filename, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
/** Выполняет только операции с подготовленным временным проектом. */
async function main() {
  if (process.argv[2] === 'create') return create();
  const fixture = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const owned = await pool.query("SELECT id FROM bot_projects WHERE id = $1 AND name = 'QA таблицы временный проект'", [fixture.projectId]);
  if (!owned.rows.length) throw new Error('Временный проект не найден');
  if (process.argv[2] === 'cleanup') { await pool.query("DELETE FROM bot_projects WHERE id = $1 AND name = 'QA таблицы временный проект'", [fixture.projectId]); console.log('Временный проект удалён'); return; }
  if (process.argv[2] === 'conflict') {
    const table = fixture.tables[1];
    await pool.query('UPDATE bot_table_rows SET data = jsonb_set(data, ARRAY[$2::text], $3::jsonb) WHERE id = $1 AND table_id = $4', [table.rows[0].id, String(table.columns[0].id), JSON.stringify('Свежее изменение'), table.id]);
    console.log('Изменена только тестовая строка'); return;
  }
  const rows = await pool.query('SELECT t.name, r.id, r.data FROM bot_tables t JOIN bot_table_rows r ON r.table_id=t.id WHERE t.project_id=$1 ORDER BY t.id,r.row_index', [fixture.projectId]);
  const scenario = (await pool.query('SELECT data FROM bot_projects WHERE id=$1',[fixture.projectId])).rows[0].data;
  console.log(JSON.stringify({ rows: rows.rows, nodes: scenario.sheets[0].nodes.map(node=>({id:node.id,text:node.data.messageText,buttons:node.data.buttons})) }));
}
main().finally(()=>pool.end());
