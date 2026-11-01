/** @fileoverview Русские подписи известных таблиц и столбцов без изменения имён в данных. */

/** Подписи служебных таблиц проекта в интерфейсе. */
const tableLabels: Record<string, string> = {
  _content: 'Контент',
  exchangers: 'Обменники',
  pairs: 'Валютные пары',
  pair_map: 'Соответствия валютных пар',
  exchangers_disabled: 'Отключённые обменники',
};
/** Подписи известных столбцов таблиц. */
const columnLabels: Record<string, string> = {
  /** Идентификатор ноды; для её полей может содержать дополнительный суффикс. */
  key: 'ID ноды',
  type: 'Тип',
  sheet: 'Лист',
  value: 'Содержимое',
};
/**
 * Возвращает понятную подпись таблицы, сохраняя неизвестные названия пользователя.
 * @param name - Внутреннее имя таблицы.
 * @returns Название для интерфейса.
 */
export function getTableLabel(name: string): string {
  return tableLabels[name] ?? name.replace(/^🔒\s*/, '');
}
/**
 * Возвращает русскую подпись известного столбца.
 * @param name - Внутреннее имя столбца.
 * @returns Заголовок для интерфейса.
 */
export function getColumnLabel(name: string): string {
  return columnLabels[name] ?? name;
}

/**
 * Показывает пользовательскую подпись, не меняя внутреннее имя столбца.
 * @param column - Столбец таблицы.
 * @returns Название для заголовков и доступных подписей.
 */
export function getColumnTitle(column: { /** Внутреннее имя. */ name: string; /** Настройки подписи. */ settings?: { /** Подпись пользователя. */ displayName: string } }): string {
  return column.settings?.displayName || getColumnLabel(column.name);
}
