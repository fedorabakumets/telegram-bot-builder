/**
 * @fileoverview Автоматический бэкап базы панели раз в `DB_BACKUP_INTERVAL_HOURS` часов
 * @module server/database/backups/dbBackupScheduler
 */

import { assertBackupLabel, DEFAULT_DB_BACKUP_LABEL, getDbBackupIntervalHours, getDbBackupsKeep } from "./dbBackupConfig";
import { createDbBackup } from "./createDbBackup";
import { resolveDbBackupsBackend } from "./dbBackupsBackend";

/** Задержка первого бэкапа после старта, чтобы не мешать восстановлению ботов */
const FIRST_RUN_DELAY_MS = 5 * 60_000;

/** Идёт ли бэкап прямо сейчас */
let running = false;

/**
 * Делает один бэкап базы панели; ошибки только пишутся в журнал.
 */
async function runScheduledBackup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (running || !databaseUrl) return;
  running = true;
  try {
    const label = assertBackupLabel(process.env.DB_BACKUP_LABEL?.trim() || DEFAULT_DB_BACKUP_LABEL);
    const backend = await resolveDbBackupsBackend();
    const { entry } = await createDbBackup({
      databaseUrl, label, backend, keep: getDbBackupsKeep(), log: (message) => console.log(`🗄️ [DbBackup] ${message}`),
    });
    console.log(`✅ [DbBackup] бэкап ${entry.id} сохранён в ${backend.configId}`);
  } catch (error) {
    console.error("❌ [DbBackup] бэкап не создан:", error instanceof Error ? error.message : error);
  } finally {
    running = false;
  }
}

/**
 * Запускает расписание бэкапов, если задан `DB_BACKUP_INTERVAL_HOURS` больше 0.
 * @returns true, если расписание запущено
 */
export function startDbBackupScheduler(): boolean {
  const hours = getDbBackupIntervalHours();
  if (hours <= 0) return false;
  setTimeout(() => void runScheduledBackup(), FIRST_RUN_DELAY_MS).unref();
  setInterval(() => void runScheduledBackup(), hours * 3_600_000).unref();
  console.log(`🗄️ [DbBackup] бэкап базы панели каждые ${hours} ч, первый через 5 мин`);
  return true;
}
