/**
 * @fileoverview Извлечение сведений об ошибке Telegram при отправке рассылки.
 */

/**
 * Сохраняет код и время ожидания из исключения Telegram API.
 * @param error - Исключение отправки
 * @returns Данные ошибки для решения о повторной отправке
 */
export function parseBroadcastSendError(error: unknown): {
  ok: false; errorCode?: number; retryAfter?: number; description: string;
} {
  const value = error as { error_code?: unknown; parameters?: { retry_after?: unknown }; message?: unknown } | null;
  return {
    ok: false,
    errorCode: typeof value?.error_code === "number" ? value.error_code : undefined,
    retryAfter: typeof value?.parameters?.retry_after === "number" ? value.parameters.retry_after : undefined,
    description: typeof value?.message === "string" ? value.message : "Сетевая ошибка",
  };
}
