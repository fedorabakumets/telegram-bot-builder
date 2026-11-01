/** @fileoverview Дополнение временного проекта большой таблицей и типами значений. */
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { Pool } = require('pg');
const fixture = JSON.parse(fs.readFileSync('output/table-ui-fixture.json', 'utf8'));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
/** Создаёт только строки таблицы подготовленного временного проекта. */
async function main() {
  const table = fixture.tables[1];
  const owned = await pool.query("SELECT t.id FROM bot_tables t JOIN bot_projects p ON p.id=t.project_id WHERE t.id=$1 AND p.id=$2 AND p.name='QA таблицы временный проект'", [table.id, fixture.projectId]);
  if (!owned.rows.length) throw new Error('Неверный тестовый проект');
  for (const [index, spec] of [['Дата', 'date'], ['Активен', 'boolean'], ['Ссылка', 'link']].entries()) {
    const result = await pool.query('INSERT INTO bot_table_columns(table_id,name,position,settings) VALUES ($1,$2,$3,$4::jsonb) RETURNING id,name', [table.id, spec[0], index+2, JSON.stringify({ dataType: spec[1] })]);
    table.columns.push(result.rows[0]);
  }
  const ids = table.columns.map(column => String(column.id));
  await pool.query(`INSERT INTO bot_table_rows(table_id,row_index,data)
    SELECT $1, i+3, jsonb_build_object($2::text,'Товар '||i,$3::text,(i/10.0)::text,$4::text,'2026-11-01',$5::text,'true',$6::text,'https://example.com/item/'||i)
    FROM generate_series(1,5000) i`, [table.id,...ids]);
  fs.writeFileSync('output/table-ui-fixture.json', JSON.stringify(fixture,null,2));
  console.log(JSON.stringify({projectId:fixture.projectId,tableId:table.id,rows:5003}));
}
main().finally(()=>pool.end());
