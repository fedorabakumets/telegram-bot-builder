/**
 * @fileoverview Применение SQL-миграций из папки migrations/ (0000_*.sql, 0001_*.sql, …)
 * Общая точка для старта сервера и ручного запуска `npm run migrate`.
 * Использует собственный пул по DATABASE_URL (без настроек server/database/db.ts),
 * чтобы поведение совпадало с прежним scripts/run-migrations.ts.
 * @module server/database/applySqlMigrations
 */

import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Устаревшие миграции, заменённые 0000_create_tables.sql: на свежей/итоговой схеме не запускаются
 */
const SKIPPED_LEGACY_MIGRATIONS = new Set([
  "0003_add_user_ids_table.sql",
  "0004_add_user_ids_unique_constraint.sql",
  "0005_make_user_ids_global.sql",
]);

/**
 * Возвращает список SQL-миграций в порядке номеров
 * @param migrationsFolder - Абсолютный путь к папке migrations
 * @returns Имена файлов миграций, отсортированные по возрастанию
 */
function listMigrationFiles(migrationsFolder: string): string[] {
  return readdirSync(migrationsFolder)
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .filter((file) => !SKIPPED_LEGACY_MIGRATIONS.has(file))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Проверяет, что ошибка означает «объект уже существует» и миграцию можно пропустить
 * @param error - Ошибка PostgreSQL
 * @returns true, если миграция уже применена ранее
 */
function isAlreadyAppliedError(error: any): boolean {
  const message = String(error?.message ?? "");
  return (
    message.includes("already exists") ||
    message.includes("duplicate column") ||
    message.includes("уже существует")
  );
}

/**
 * Применяет все SQL-миграции из migrations/ по порядку.
 * Миграции идемпотентны и выполняются при каждом вызове; ошибки «уже существует» пропускаются.
 * @param databaseUrl - Строка подключения (по умолчанию process.env.DATABASE_URL)
 * @returns Promise, который отклоняется при первой непропускаемой ошибке
 */
export async function applySqlMigrations(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): Promise<void> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not found. Cannot run migrations.");
  }

  console.log("🔧 Starting database migrations...");
  const migrationsFolder = join(process.cwd(), "migrations");
  console.log(`📂 Migrations folder: ${migrationsFolder}`);

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    for (const file of listMigrationFiles(migrationsFolder)) {
      console.log(`📄 Applying migration: ${file}`);
      try {
        await pool.query(readFileSync(join(migrationsFolder, file), "utf-8"));
        console.log(`✅ Applied: ${file}`);
      } catch (error: any) {
        if (!isAlreadyAppliedError(error)) {
          console.error(`❌ Error applying ${file}:`, error.message);
          throw error;
        }
        console.log(`⏭️  Skipped (already exists): ${file}`);
      }
    }
    console.log("✅ All migrations completed successfully!");
  } finally {
    await pool.end();
  }
}
