import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found. Cannot run migrations.');
    process.exit(1);
  }

  console.log('🔧 Starting database migrations...');

  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);

    // Читаем SQL файлы миграций
    const migrationsFolder = join(process.cwd(), 'migrations');
    console.log(`📂 Migrations folder: ${migrationsFolder}`);

    const migrationFiles = [
      '0000_create_tables.sql',
      '0001_add_google_sheet_export_fields.sql',
      '0002_add_structure_export_fields.sql',
      '0005_make_user_ids_global.sql',
      '0006_migrate_telegram_settings_to_global.sql'
    ];

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsFolder, file);
      console.log(`📄 Applying migration: ${file}`);
      
      try {
        const sql = readFileSync(migrationPath, 'utf-8');
        await pool.query(sql);
        console.log(`✅ Applied: ${file}`);
      } catch (error: any) {
        if (
          error.message.includes('already exists') || 
          error.message.includes('duplicate column') ||
          error.message.includes('уже существует')
        ) {
          console.log(`⏭️  Skipped (already exists): ${file}`);
        } else {
          console.error(`❌ Error applying ${file}:`, error.message);
          throw error;
        }
      }
    }

    await pool.end();
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
