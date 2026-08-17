/**
 * @fileoverview Русские подписи статусов ошибок доставки рассылки
 * @module client/components/editor/broadcast/utils/format-delivery-error-reason
 */

/** Известные тексты Telegram → понятная подпись */
const TELEGRAM_REASON_LABELS: Array<[RegExp, string]> = [
  [/blocked by the user|user is blocked|bot was blocked/i, 'Заблокировал бота'],
  [/user is deactivated|deleted account/i, 'Аккаунт удалён'],
  [/chat not found|peer_id_invalid/i, 'Чат или пользователь не найден'],
  [/retry after|too many requests|flood/i, 'Слишком частые запросы'],
  [/message is too long/i, 'Сообщение слишком длинное'],
  [/not enough rights|have no rights|chat_write_forbidden/i, 'Нет прав на отправку'],
  [/bot was kicked|kicked from/i, 'Бота исключили из чата'],
  [/forbidden/i, 'Telegram запретил отправку'],
];

/**
 * Переводит сырое сообщение Telegram в короткую русскую подпись
 * @param errorMessage - Сырой текст ошибки
 * @returns Подпись или null, если шаблон не подошёл
 */
function translateTelegramMessage(errorMessage: string): string | null {
  for (const [pattern, label] of TELEGRAM_REASON_LABELS) {
    if (pattern.test(errorMessage)) return label;
  }
  return null;
}

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
  if (status === 'blocked') return 'Заблокировал бота';
  if (status === 'not_found') return 'Аккаунт удалён';
  const raw = errorMessage?.trim();
  if (raw) {
    const translated = translateTelegramMessage(raw);
    if (translated) return translated;
  }
  return 'Ошибка доставки';
}
