/**
 * @fileoverview Русские подписи статусов ошибок доставки рассылки
 * @module client/components/editor/broadcast/utils/format-delivery-error-reason
 */

/**
 * Возвращает понятную подпись причины ошибки доставки
 * @param status - Статус результата (blocked | not_found | failed | …)
 * @param errorMessage - Сырое сообщение Telegram
 * @returns Текст для UI
 */
export function formatDeliveryErrorReason(
  status: string,
  errorMessage?: string | null,
): string {
  if (status === "blocked") return "Заблокировал бота";
  if (status === "not_found") return "Аккаунт удалён";
  return errorMessage?.trim() || status || "Ошибка";
}
