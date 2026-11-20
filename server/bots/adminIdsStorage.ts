/** @fileoverview Представление явно сохранённого списка администраторов проекта. */

/** Две пустые части CSV отличают сохранённый пустой список от отсутствия настройки. */
const SAVED_EMPTY_ADMIN_IDS = ',';

/**
 * Разбирает список ID из базы, запроса или старого окружения.
 * @param raw - Строка с идентификаторами через запятую.
 * @returns Непустые части списка.
 */
export function parseAdminIds(raw: string): string[] {
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

/**
 * Готовит явно заданный список к записи, сохраняя намерение очистить его.
 * @param raw - Сохранённое пользователем значение списка.
 * @returns CSV, который можно передать обработчику бота без резервного чтения старой настройки.
 */
export function encodeAdminIdsForStorage(raw: string): string {
  return parseAdminIds(raw).join(',') || SAVED_EMPTY_ADMIN_IDS;
}
