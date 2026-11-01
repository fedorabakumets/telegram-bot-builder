/** @fileoverview Применение добавочной миграции настроек столбцов в локальной базе. */
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const fs = require('node:fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(fs.readFileSync('migrations/0023_table_column_settings.sql', 'utf8')).then(() => console.log('Настройки столбцов готовы')).finally(() => pool.end());
