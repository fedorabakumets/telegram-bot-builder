/**
 * @fileoverview Доставка сохранённого дампа в Telegram и проверка реквизитов файлом.
 */
import type { DbBackupEntry } from "./dbBackupIndex";
import { getTelegramBackupConfig, type TelegramBackupConfig } from "./telegramBackupConfig";
import { sendTelegramBackupDocument } from "./telegramBackupRequest";

/**
 * Форматирует дату бэкапа по московскому времени независимо от часового пояса сервера.
 * @param createdAt - Дата создания в формате ISO
 * @returns Читаемая русская дата с обозначением часового пояса
 */
export function formatBackupDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "дата неизвестна";
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.day} ${values.month} ${values.year}, ${values.hour}:${values.minute}:${values.second} (МСК)`;
}

/**
 * Отправляет сохранённый бэкап; ошибка доставки не отменяет создание дампа.
 * @param dump - Сжатый дамп базы
 * @param label - Метка базы
 * @param entry - Данные сохранённого бэкапа
 * @param config - Настройки, по умолчанию из админки
 * @param send - Отправитель для тестов
 * @returns Предупреждение при сбое, иначе undefined
 */
export async function deliverTelegramBackup(
  dump: Buffer, label: string, entry: DbBackupEntry,
  config: TelegramBackupConfig = getTelegramBackupConfig(), send = sendTelegramBackupDocument,
): Promise<string | undefined> {
  if (!config.enabled) return;
  try {
    await send(config, dump, `${label}-${entry.id}.dump`,
      `Бэкап базы: ${label}\nСоздан: ${formatBackupDate(entry.createdAt)}\nРазмер: ${(entry.size / 1048576).toFixed(2)} МБ`);
  } catch (error) {
    return `Бэкап ${label} сохранён, доставка не выполнена: ${error instanceof Error ? error.message : "ошибка Telegram"}`;
  }
  return undefined;
}

/**
 * Проверяет сохранённые реквизиты небольшим файлом без содержимого базы.
 * @returns Promise<void>
 */
export async function testTelegramBackupDelivery(): Promise<void> {
  await sendTelegramBackupDocument(getTelegramBackupConfig(),
    Buffer.from("Проверка доставки бэкапов Telegram Builder. Данных базы в этом файле нет.\n"),
    "backup-delivery-test.txt", "Проверка отправки бэкапов");
}
