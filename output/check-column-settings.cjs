/** @fileoverview Проверка сохранённых настроек только временной тестовой таблицы. */
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { Pool } = require('pg');
const fixture = JSON.parse(fs.readFileSync('output/table-ui-fixture.json','utf8'));
const pool = new Pool({ connectionString:process.env.DATABASE_URL });
pool.query('SELECT name, settings FROM bot_table_columns WHERE table_id=$1 ORDER BY position',[fixture.tables[1].id]).then(result=>console.log(JSON.stringify(result.rows))).finally(()=>pool.end());
