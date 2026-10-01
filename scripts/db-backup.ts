/**
 * @fileoverview CLI: бэкап, список бэкапов и восстановление базы PostgreSQL
 *
 * Использование:
 *   npm run db:backup -- [--url <строка>] [--label panel] [--storage <id>] [--keep 7]
 *   npm run db:backups -- [--label panel] [--storage <id>]
 *   npm run db:restore -- --url <строка> [--label panel] [--id latest] [--storage <id>] [--force]
 * Без --url бэкап снимается с DATABASE_URL. Для восстановления --url обязателен.
 * Без --storage берётся DB_BACKUPS_STORAGE_ID, иначе приватная папка DB_BACKUPS_DIR.
 * @module scripts/db-backup
 */

import "dotenv/config";

/**
 * Достаёт значение аргумента командной строки.
 * @param name - Имя флага (например, --url)
 * @returns Значение или undefined
 */
function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/**
 * Печатает шаг с меткой команды.
 * @param message - Текст шага
 */
function log(message: string): void {
  console.log(`🗄️  ${message}`);
}

/**
 * Точка входа: выполняет команду create, list или restore.
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  const config = await import("../server/database/backups/dbBackupConfig");
  const { resolveDbBackupsBackend } = await import("../server/database/backups/dbBackupsBackend");
  const label = config.assertBackupLabel(argValue("--label") ?? process.env.DB_BACKUP_LABEL?.trim() ?? config.DEFAULT_DB_BACKUP_LABEL);
  const backend = await resolveDbBackupsBackend(argValue("--storage"));
  log(`хранилище: ${backend.name} (${backend.configId})`);

  if (command === "create") {
    const databaseUrl = argValue("--url") ?? process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("Укажите --url или DATABASE_URL");
    const keep = Number.parseInt(argValue("--keep") ?? "", 10) || config.getDbBackupsKeep();
    const { createDbBackup } = await import("../server/database/backups/createDbBackup");
    const { entry } = await createDbBackup({ databaseUrl, label, backend, keep, log });
    log(`✅ бэкап ${entry.id} создан`);
    return;
  }

  if (command === "list") {
    const { readBackupIndex } = await import("../server/database/backups/dbBackupIndex");
    const index = await readBackupIndex(backend, label);
    if (index.entries.length === 0) log(`бэкапов с меткой ${label} нет`);
    for (const entry of index.entries) {
      const rows = Object.values(entry.tables).reduce((sum, n) => sum + n, 0);
      log(`${entry.id}  ${(entry.size / 1024).toFixed(0)} КБ  таблиц ${Object.keys(entry.tables).length}  строк ${rows}  PostgreSQL ${entry.serverVersion}`);
    }
    return;
  }

  if (command === "restore") {
    const databaseUrl = argValue("--url");
    if (!databaseUrl) throw new Error("Для восстановления укажите целевую базу: --url <строка подключения>");
    const { restoreDbBackup } = await import("../server/database/backups/restoreDbBackup");
    const result = await restoreDbBackup({
      databaseUrl, label, backend, id: argValue("--id") ?? "latest", force: process.argv.includes("--force"), log,
    });
    for (const m of result.mismatches) log(`⚠️ ${m.table}: в бэкапе ${m.expected}, в базе ${m.actual ?? "нет таблицы"}`);
    if (result.mismatches.length > 0) process.exit(2);
    log(`✅ бэкап ${result.entry.id} восстановлен, числа строк совпали`);
    return;
  }

  throw new Error(`Неизвестная команда "${command ?? ""}": create, list или restore`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exit(1);
  });
