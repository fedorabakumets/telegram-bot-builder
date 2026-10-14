/** @fileoverview Проверки источника сообщений и безопасности действий общей истории. */

/**
 * Определяет групповой источник сообщения.
 * @param chatType - Тип исходного чата
 * @returns Признак сообщения группы
 */
export function isGroupSource(chatType?: string | null): boolean {
  return chatType === 'group' || chatType === 'supergroup';
}

/**
 * Разрешает действия только в исходном диалоге сообщения.
 * @param isGroupDialog - Открыт ли групповой чат
 * @param chatType - Тип исходного чата
 * @returns Допустимость редактирования и удаления
 */
export function canActOnDialogMessage(isGroupDialog: boolean, chatType?: string | null): boolean {
  return isGroupDialog || !chatType || chatType === 'private';
}

/**
 * Проверяет принадлежность запроса списку диалогов.
 * @param queryKey - Ключ кэша пользователей
 * @returns Признак списка диалогов
 */
export function isDialogListCache(queryKey: readonly unknown[]): boolean {
  return queryKey[7] === true || queryKey[8] !== undefined;
}
