/**
 * @fileoverview Немедленный бэкап всех целей расписания
 * @module server/database/backups/runDbBackupNow
 */

import { createDbBackup } from "./createDbBackup";
import { getDbBackupsKeep } from "./dbBackupConfig";
import { getDbBackupTargets } from "./dbBackupTargets";
import { resolveDbBackupsBackend } from "./dbBackupsBackend";

/**
 * Снимает дамп каждой цели. Ошибка одной базы прерывает запрос,
 * чтобы кнопка в админке показала причину.
 * @returns Метки успешно сохранённых баз
 */
export async function runDbBackupNow(): Promise<string[]> {
  const targets = getDbBackupTargets();
  if (targets.length === 0) return [];
  const backend = await resolveDbBackupsBackend();
  const labels: string[] = [];
  for (const target of targets) {
    await createDbBackup({
      databaseUrl: target.databaseUrl,
      label: target.label,
      backend,
      keep: getDbBackupsKeep(),
      log: (message) => console.log(`🗄️ [DbBackup:${target.label}] ${message}`),
    });
    labels.push(target.label);
  }
  return labels;
}
