/** @fileoverview Резервирование служебного окружения общего Telegram-клиента вне пользовательских переменных бота. */

/**
 * Проверяет принадлежность имени серверу Telegram-аккаунтов или его управляемому раннеру.
 * @param name - Имя пользовательской либо наследуемой переменной.
 * @returns Признак запрета пользовательской подмены служебного окружения.
 */
export function isManagedTelegramEnvironmentKey(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.startsWith('TELETHON_BROKER_') || upper.startsWith('PROJECT_TELEGRAM_');
}

/**
 * Исключает служебные настройки до добавления подписанных значений сервером.
 * @param variables - Пользовательские переменные после раскрытия разрешённых ссылок.
 * @returns Только переменные, которыми пользователь вправе управлять.
 */
export function withoutManagedTelegramEnvironment<T extends { /** Имя переменной. */ key: string }>(variables: T[]): T[] {
  return variables.filter(({ key }) => !isManagedTelegramEnvironmentKey(key));
}
