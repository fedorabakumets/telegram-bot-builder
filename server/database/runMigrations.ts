/**
 * @fileoverview Запуск SQL-миграций при старте сервера
 * @module server/database/runMigrations
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "./db";

/**
 * Выполняет SQL-миграцию из указанного файла
 * @param filename - Имя файла миграции в папке migrations/
 * @returns Promise<void>
 */
async function runMigrationFile(filename: string): Promise<void> {
  const filePath = join(__dirname, "migrations", filename);
  const sql = readFileSync(filePath, "utf-8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`[Migrations] Выполнена миграция: ${filename}`);
  } finally {
    client.release();
  }
}

/**
 * Запускает все необходимые миграции базы данных
 * @returns Promise<void>
 */
export async function runMigrations(): Promise<void> {
  try {
    await runMigrationFile("add-bot-logs-table.sql");
  } catch (err) {
    console.error("[Migrations] Ошибка выполнения миграций:", err);
  }
}
