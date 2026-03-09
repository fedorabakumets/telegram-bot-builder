/**
 * @fileoverview Константы приоритетов для условных сообщений
 * @module constants/conditional.constants
 */

/**
 * Приоритеты для типов условий
 * @description Чем выше число, тем раньше проверяется условие
 */
export const CONDITION_PRIORITIES = {
  /** Пользователь впервые или возвращается (100) */
  USER_STATUS: 100,
  /** Переменная существует или не существует (50) */
  DATA_EXISTS: 50,
  /** Совпадение значения переменной (30) */
  DATA_MATCH: 30,
  /** Остальные условия (10) */
  DEFAULT: 10
} as const;

/**
 * Типы условий пользователя
 * @description Условия первого запуска и возврата
 */
export const USER_STATUS_CONDITIONS = [
  'first_time',
  'returning_user'
] as const;

/**
 * Типы условий существования данных
 * @description Проверка наличия или отсутствия переменных
 */
export const DATA_EXISTS_CONDITIONS = [
  'user_data_exists',
  'user_data_not_exists'
] as const;

/**
 * Типы условий сравнения данных
 * @description Проверка равенства или содержания
 */
export const DATA_MATCH_CONDITIONS = [
  'user_data_equals',
  'user_data_contains'
] as const;

/**
 * Получить приоритет для типа условия
 * @param {string} condition - Тип условия
 * @returns {number} Приоритет условия
 */
export function getConditionPriority(condition: string): number {
  if (USER_STATUS_CONDITIONS.includes(condition as typeof USER_STATUS_CONDITIONS[number])) {
    return CONDITION_PRIORITIES.USER_STATUS;
  }
  if (DATA_EXISTS_CONDITIONS.includes(condition as typeof DATA_EXISTS_CONDITIONS[number])) {
    return CONDITION_PRIORITIES.DATA_EXISTS;
  }
  if (DATA_MATCH_CONDITIONS.includes(condition as typeof DATA_MATCH_CONDITIONS[number])) {
    return CONDITION_PRIORITIES.DATA_MATCH;
  }
  return CONDITION_PRIORITIES.DEFAULT;
}
