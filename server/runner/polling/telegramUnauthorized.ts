/** @fileoverview Подтверждённый отказ Telegram с отпечатком секрета конкретного запуска. */
import { createHash } from "node:crypto";

/** Отказ известного метода Bot API, безопасный для передачи через жизненный цикл runtime. */
export class TelegramTokenUnauthorized extends Error {
  /** Отпечаток секрета запроса; сам секрет не сохраняется в ошибке. */
  readonly tokenFingerprint: string;
  /** Метод Bot API, вернувший структурированный отказ Telegram. */
  readonly method: string;
  /** @param token - Секрет конкретного запроса. @param method - Известный метод Telegram. */
  constructor(token: string, method: string) {
    super("Telegram отклонил токен бота: Unauthorized");
    this.name = "TelegramTokenUnauthorized";
    this.tokenFingerprint = createHash("sha256").update(token).digest("hex");
    this.method = method;
  }
}

/** Проверяет форму ответа Bot API, не принимая HTML, произвольный HTTP401 или текст ошибки сервиса. */
export function confirmedTelegramUnauthorized(status: number, body: Record<string, unknown>): boolean {
  return status === 401 && body.ok === false && body.error_code === 401 && body.description === "Unauthorized";
}
