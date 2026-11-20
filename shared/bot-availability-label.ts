/** @fileoverview Подписи недоступности самого бота, не связанные с блокировкой пользователем. */
/** Общая подпись для строки пользователя и фильтра недоступных ботов. */
export const NO_AVAILABLE_BOTS_LABEL = 'Нет доступных ботов в Telegram';
/**
 * Различает подтверждённую блокировку бота, отказ токена и локальное отключение.
 * @param error - Сохранённая причина недоступности бота.
 * @param active - Включён ли бот в настройках.
 * @returns Подпись проблемы либо отсутствие подтверждённой проблемы.
 */
export function botAvailabilityLabel(error: string | null | undefined, active: number | null | undefined): string | null {
  if (error === 'telegram_frozen') return 'Бот заморожен Telegram';
  if (error === 'bot_blocked' || error === 'bot_deactivated') return 'Бот заблокирован Telegram';
  if (error === 'unauthorized') return 'Telegram отклонил токен';
  if (error) return 'Бот недоступен в Telegram';
  if (active === 0) return 'Бот отключён';
  return null;
}
/** Сокращает общий статус бота для селектора без повторения правил определения причины. @param error - Причина недоступности. @param active - Состояние включения. @returns Короткая подпись. */
export function botShortStatusLabel(error: string | null | undefined, active: number | null | undefined): string {
  const label = botAvailabilityLabel(error?.trim(), active);
  if (label === 'Бот заморожен Telegram' || label === 'Бот заблокирован Telegram') return 'Заморожен';
  if (label === 'Telegram отклонил токен') return 'Ошибка токена';
  if (label === 'Бот отключён') return 'Отключён';
  return label ? 'Недоступен' : 'Активен';
}
