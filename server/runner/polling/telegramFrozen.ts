/** @fileoverview Подтверждённая заморозка Telegram Bot API без публикации секрета запуска. */
import { createHash } from "node:crypto";

/** Фатальный отказ замороженного бота, привязанный к конкретному секрету и методу. */
export class TelegramBotFrozen extends Error {
  /** Отпечаток секрета запроса для защиты от запоздалого события после замены. */
  readonly tokenFingerprint: string;
  /** Метод Telegram, подтвердивший заморозку. */
  readonly method: string;
  /** @param token - Секрет наблюдаемого запуска. @param method - Метод Bot API. */
  constructor(token: string, method: string) {
    super("Telegram заморозил бота: FROZEN_METHOD_INVALID");
    this.name = "TelegramBotFrozen";
    this.tokenFingerprint = createHash("sha256").update(token).digest("hex");
    this.method = method;
  }
}

/** Принимает только структурированный ответ Telegram400, исключая совпадения в стороннем тексте. */
export function confirmedTelegramFrozen(status: number, body: Record<string, unknown>): boolean {
  return status === 400 && body.ok === false && body.error_code === 400
    && (body.description === "Bad Request: FROZEN_METHOD_INVALID" || body.description === "FROZEN_METHOD_INVALID");
}
