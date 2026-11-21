/** @fileoverview Безопасная классификация окончательного отказа Telegram без сохранения его произвольного текста. */
import { createHash } from "node:crypto";

/** Подтверждённая разновидность отказа получения обновлений. */
export type PollingRejectionReason = "polling_conflict" | "webhook_conflict" | "telegram_rejected";

/** Окончательный отказ Bot API с привязкой к секрету конкретного запуска. */
export class PollingRejected extends Error {
  /** Метод, вернувший отказ Telegram. */
  readonly method = "getUpdates";
  /** Отпечаток секрета; сам секрет и исходный ответ не сохраняются. */
  readonly tokenFingerprint: string;
  /** Классификация только известных описаний подтверждённого ответа 409. */
  readonly reason: PollingRejectionReason;
  /** @param token - Секрет запроса. @param code - Числовой код Telegram. @param reason - Проверенная разновидность отказа. */
  constructor(token: string, readonly code: number, reason: PollingRejectionReason = "telegram_rejected") {
    super(reason === "polling_conflict"
      ? "Telegram отклонил polling: другой экземпляр бота уже получает обновления (код 409)"
      : reason === "webhook_conflict"
        ? "Telegram отклонил polling: у бота активен webhook (код 409)"
        : `Telegram отклонил polling: код ${code}`);
    this.name = "PollingRejected";
    this.reason = reason;
    this.tokenFingerprint = createHash("sha256").update(token).digest("hex");
  }
}

/** Проверяет точные ответы Bot API, не принимая произвольный текст за доказательство конфликта. */
export function pollingRejectionReason(status: number, body: Record<string, unknown>): PollingRejectionReason {
  if (status !== 409 || body.ok !== false || body.error_code !== 409) return "telegram_rejected";
  if (body.description === "Conflict: terminated by other getUpdates request; make sure that only one bot instance is running")
    return "polling_conflict";
  if (body.description === "Conflict: can't use getUpdates method while webhook is active; use deleteWebhook to delete the webhook first")
    return "webhook_conflict";
  return "telegram_rejected";
}
