/** @fileoverview Безопасная передача подтверждённой ошибки авторизации до завершения регистрации бота. */
import type { PollingBot } from "./dispatcherTypes";
import { TelegramTokenUnauthorized } from "./telegramUnauthorized";
import { TelegramBotFrozen } from "./telegramFrozen";

/** Возвращает структурированное событие только для отказа реального транспорта Bot API. */
export function runtimeFailureEvent(bot: PollingBot, error: unknown): string | undefined {
  if (!(error instanceof TelegramTokenUnauthorized) && !(error instanceof TelegramBotFrozen)) return undefined;
  const launchId = Number(bot.env.BOT_LAUNCH_ID);
  return JSON.stringify({ type: "bot_runtime_error", token_id: bot.tokenId,
    ...(Number.isSafeInteger(launchId) && launchId > 0 ? { launch_id: launchId } : {}),
    code: error instanceof TelegramBotFrozen ? "telegram_frozen" : "telegram_unauthorized",
    source: "telegram_bot_api", method: error.method,
    tokenFingerprint: error.tokenFingerprint });
}
