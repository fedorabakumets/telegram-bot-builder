/**
 * @fileoverview Автоматический бэкап баз раз в `DB_BACKUP_INTERVAL_HOURS` часов:
 * база панели и базы из `DB_BACKUP_TARGETS` (см. dbBackupTargets.ts)
 * @module server/database/backups/dbBackupScheduler
 */

import type { StorageBackend } from "../../storage/storage-backend";
import { getDbBackupIntervalHours, getDbBackupsKeep } from "./dbBackupConfig";
import { createDbBackup } from "./createDbBackup";
import { readBackupIndex } from "./dbBackupIndex";
import { resolveDbBackupsBackend } from "./dbBackupsBackend";
import { getDbBackupTargets, staleBackupWarning, type DbBackupTarget } from "./dbBackupTargets";

/** Задержка первого бэкапа после старта, чтобы не мешать восстановлению ботов */
const FIRST_RUN_DELAY_MS = 5 * 60_000;

/** Идёт ли бэкап прямо сейчас */
let running = false;

/** Таймер первого запуска после старта или сохранения настроек */
let firstTimer: ReturnType<typeof setTimeout> | undefined;

/** Повтор расписания */
let repeatTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Бэкапит одну базу; при ошибке предупреждает, если последний удачный бэкап устарел
 * @param target - База и метка
 * @param backend - Хранилище бэкапов
 * @param intervalHours - Интервал расписания
 */
async function backupTarget(target: DbBackupTarget, backend: StorageBackend, intervalHours: number): Promise<void> {
  const { label, databaseUrl } = target;
  try {
    const { entry } = await createDbBackup({
      databaseUrl, label, backend, keep: getDbBackupsKeep(), log: (message) => console.log(`🗄️ [DbBackup:${label}] ${message}`),
    });
    console.log(`✅ [DbBackup:${label}] бэкап ${entry.id} сохранён в ${backend.configId}`);
  } catch (error) {
    console.error(`❌ [DbBackup:${label}] бэкап не создан:`, error instanceof Error ? error.message : error);
    const index = await readBackupIndex(backend, label).catch(() => null);
    const warning = index ? staleBackupWarning(index.entries, intervalHours) : "индекс бэкапов не прочитан";
    if (warning) console.warn(`⚠️ [DbBackup:${label}] ${warning}`);
  }
}

/**
 * Бэкапит все базы по очереди; ошибки только пишутся в журнал.
 * @param intervalHours - Интервал расписания
 */
export async function runScheduledBackup(intervalHours: number): Promise<void> {
  if (running) return;
  running = true;
  try {
    const backend = await resolveDbBackupsBackend();
    for (const target of getDbBackupTargets()) await backupTarget(target, backend, intervalHours);
  } catch (error) {
    console.error("❌ [DbBackup] расписание бэкапов:", error instanceof Error ? error.message : error);
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
  const labels = getDbBackupTargets().map((t) => t.label).join(", ");
  firstTimer = setTimeout(() => void runScheduledBackup(hours), FIRST_RUN_DELAY_MS);
  firstTimer.unref();
  repeatTimer = setInterval(() => void runScheduledBackup(hours), hours * 3_600_000);
  repeatTimer.unref();
  console.log(`🗄️ [DbBackup] бэкап (${labels}) каждые ${hours} ч, первый через 5 мин`);
  return true;
}

/**
 * Сбрасывает таймеры и запускает расписание заново.
 * Вызывается после сохранения раздела бэкапов, без рестарта процесса.
 * @returns true, если расписание снова запущено
 */
export function restartDbBackupScheduler(): boolean {
  if (firstTimer) clearTimeout(firstTimer);
  if (repeatTimer) clearInterval(repeatTimer);
  firstTimer = undefined;
  repeatTimer = undefined;
  return startDbBackupScheduler();
}
