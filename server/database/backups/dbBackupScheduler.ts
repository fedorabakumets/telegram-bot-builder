/**
 * @fileoverview Автоматический бэкап баз раз в `DB_BACKUP_INTERVAL_HOURS` часов:
 * база панели и базы из `DB_BACKUP_TARGETS` (см. dbBackupTargets.ts)
 * @module server/database/backups/dbBackupScheduler
 */

import type { StorageBackend } from "../../storage/storage-backend";
import { getDbBackupIntervalHours, getDbBackupsKeep } from "./dbBackupConfig";
import { createDbBackup } from "./createDbBackup";
import { readBackupIndex } from "./dbBackupIndex";
import { runDueDbBackup } from "./dbBackupDue";
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

/** Хранилище, для которого предупреждение уже выведено. */
let warnedLocalBackend: string | undefined;

/**
 * Бэкапит одну базу; при ошибке предупреждает, если последний удачный бэкап устарел
 * @param target - База и метка
 * @param backend - Хранилище бэкапов
 * @param intervalHours - Интервал расписания
 */
async function backupTarget(target: DbBackupTarget, backend: StorageBackend, intervalHours: number): Promise<void> {
  const { label, databaseUrl } = target;
  try {
    await runDueDbBackup(backend, label, intervalHours, async () => {
      const { entry } = await createDbBackup({
        databaseUrl, label, backend, keep: getDbBackupsKeep(), log: (message) => console.log(`🗄️ [DbBackup:${label}] ${message}`),
      });
      console.log(`✅ [DbBackup:${label}] бэкап ${entry.id} сохранён в ${backend.configId}`);
    });
  } catch (error) {
    console.error(`❌ [DbBackup:${label}] бэкап не создан:`, error instanceof Error ? error.message : error);
    const index = await readBackupIndex(backend, label).catch(() => null);
    const warning = index ? staleBackupWarning(index.entries, intervalHours) : "индекс бэкапов не прочитан";
    if (warning) console.warn(`⚠️ [DbBackup:${label}] ${warning}`);
  }
}

/**
 * Проверяет сохранённые сроки всех баз по очереди; ошибки повторяются в следующей проверке.
 * @param intervalHours - Интервал расписания
 */
export async function runScheduledBackup(intervalHours: number): Promise<void> {
  if (running) return;
  running = true;
  try {
    const backend = await resolveDbBackupsBackend();
    if (process.env.RAILWAY_ENVIRONMENT_ID && backend.backend === "local" && warnedLocalBackend !== backend.configId) {
      console.warn("⚠️ [DbBackup] Локальная папка может быть временной на Railway: проверьте постоянный том для дампов и индекса.");
      warnedLocalBackend = backend.configId;
    }
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
  if (firstTimer) clearTimeout(firstTimer);
  if (repeatTimer) clearInterval(repeatTimer);
  firstTimer = undefined;
  repeatTimer = undefined;
  const hours = getDbBackupIntervalHours();
  if (hours <= 0) return false;
  const labels = getDbBackupTargets().map((t) => t.label).join(", ");
  firstTimer = setTimeout(() => void runScheduledBackup(hours), FIRST_RUN_DELAY_MS);
  firstTimer.unref();
  // Индекс хранится вне процесса: деплой и ручная копия не сбрасывают срок следующего бэкапа.
  repeatTimer = setInterval(() => void runScheduledBackup(hours), Math.min(FIRST_RUN_DELAY_MS, hours * 3_600_000));
  repeatTimer.unref();
  console.log(`🗄️ [DbBackup] бэкап (${labels}) каждые ${hours} ч от последней копии; проверка через 5 мин`);
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
