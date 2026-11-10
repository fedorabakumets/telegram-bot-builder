/** @fileoverview Доставка небольшого дампа в Telegram без чтения больших файлов в память. */
import { readFile } from 'fs/promises';
import type { DbBackupEntry } from './dbBackupIndex';
import { deliverTelegramBackup } from './telegramBackupDelivery';
import { getTelegramBackupConfig } from './telegramBackupConfig';
import { TELEGRAM_BACKUP_MAX_BYTES } from './telegramBackupRequest';

/**
 * Читает файл только при включённой доставке и допустимом размере.
 * @param filePath - Путь сохранённого дампа
 * @param label - Метка базы
 * @param entry - Метаданные дампа
 * @returns Предупреждение, не отменяющее сохранённый бэкап
 */
export async function deliverTelegramBackupFile(filePath: string, label: string, entry: DbBackupEntry): Promise<string | undefined> {
  const config = getTelegramBackupConfig();
  if (!config.enabled) return;
  if (entry.size > TELEGRAM_BACKUP_MAX_BYTES) {
    return `Бэкап ${label} сохранён, доставка не выполнена: файл больше лимита Telegram 50 МБ`;
  }
  try {
    return await deliverTelegramBackup(await readFile(filePath), label, entry, config);
  } catch {
    return `Бэкап ${label} сохранён, доставка не выполнена: не удалось прочитать файл`;
  }
}
