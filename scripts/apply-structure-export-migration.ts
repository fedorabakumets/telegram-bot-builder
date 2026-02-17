/**
 * @fileoverview Скрипт для применения миграции полей экспорта структуры
 * 
 * Добавляет в таблицу bot_projects поля:
 * - last_exported_structure_sheet_id
 * - last_exported_structure_sheet_url  
 * - last_exported_structure_at
 * 
 * @version 1.0.0
 */

import { db } from '../server/database/db';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    console.log('🔄 Применение миграции: добавление полей экспорта структуры...');
    
    await db.execute(sql`
      ALTER TABLE "bot_projects" 
      ADD COLUMN IF NOT EXISTS "last_exported_structure_sheet_id" text,
      ADD COLUMN IF NOT EXISTS "last_exported_structure_sheet_url" text,
      ADD COLUMN IF NOT EXISTS "last_exported_structure_at" timestamp;
    `);
    
    console.log('✅ Миграция успешно применена!');
    console.log('📊 Добавлены поля:');
    console.log('   - last_exported_structure_sheet_id (text)');
    console.log('   - last_exported_structure_sheet_url (text)');
    console.log('   - last_exported_structure_at (timestamp)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error);
    process.exit(1);
  }
}

applyMigration();
