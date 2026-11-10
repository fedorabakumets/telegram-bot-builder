/**
 * @fileoverview Единый подсчёт пользователей и уникальных групп рассылки.
 */

/**
 * Убирает пустые и повторяющиеся идентификаторы групп, сохраняя порядок.
 * @param groupIds - Выбранные идентификаторы чатов Telegram
 * @returns Уникальные непустые идентификаторы групп
 */
export function normalizeBroadcastGroupIds(groupIds: readonly string[] | undefined): string[] {
  return [...new Set((groupIds ?? []).map((id) => id.trim()).filter(Boolean))];
}

/**
 * Считает все доставки одного бота, включая группы без пользователей.
 * @param userCount - Число пользователей, выбранных фильтрами аудитории
 * @param groupIds - Выбранные идентификаторы групп
 * @returns Общее число запланированных доставок
 */
export function countBroadcastRecipients(userCount: number, groupIds: readonly string[] | undefined): number {
  return userCount + normalizeBroadcastGroupIds(groupIds).length;
}
