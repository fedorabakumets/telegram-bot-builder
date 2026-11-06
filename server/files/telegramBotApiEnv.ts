/** @fileoverview Передача выбранного адреса Telegram Bot API в окружение бота. */

import { getTelegramApiBaseUrl } from "../utils/telegram-api-url";

/**
 * Заменяет пользовательскую переменную актуальной настройкой площадки.
 * @param variables - Переменные окружения бота.
 * @returns Переменные с адресом локального API только в локальном режиме.
 */
export function withTelegramBotApiUrl<T extends { key: string; value: string }>(variables: T[]): Array<T | { key: string; value: string }> {
  const result = variables.filter((variable) => variable.key !== "TELEGRAM_BOT_API_URL");
  const url = getTelegramApiBaseUrl();
  return url === "https://api.telegram.org" ? result : [...result, { key: "TELEGRAM_BOT_API_URL", value: url }];
}
