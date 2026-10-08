/**
 * @fileoverview Настройки дополнительной доставки бэкапов в Telegram.
 */
import { runtimeEnv, runtimeFlag } from "../../services/runtime-overlay";

/** Настройки получателя бэкапов */
export interface TelegramBackupConfig {
  /** Включена автоматическая доставка */
  enabled: boolean;
  /** Секретный токен бота */
  token: string;
  /** Числовой ID личного чата или группы, либо имя канала */
  chatId: string;
}

/**
 * Читает сохранённые настройки поверх окружения.
 * @param env - Окружение для чтения и тестов
 * @returns Настройки Telegram
 */
export function getTelegramBackupConfig(env: NodeJS.ProcessEnv = process.env): TelegramBackupConfig {
  return {
    enabled: runtimeFlag("DB_BACKUP_TELEGRAM_ENABLED", env),
    token: runtimeEnv("DB_BACKUP_TELEGRAM_BOT_TOKEN", env) ?? "",
    chatId: runtimeEnv("DB_BACKUP_TELEGRAM_CHAT_ID", env) ?? "",
  };
}

/**
 * Проверяет реквизиты без вывода секретов в ошибке.
 * @param config - Настройки получателя
 */
export function assertTelegramBackupConfig(config: TelegramBackupConfig): void {
  if (!/^\d+:[\w-]+$/.test(config.token)) throw new Error("Укажите корректный токен бота Telegram");
  if (!/^(?:-?\d+|@[a-zA-Z][\w]{4,})$/.test(config.chatId)) throw new Error("Укажите корректный Chat ID Telegram");
}
