/**
 * @fileoverview Подписи операторов проверки перед оплатой
 * @module components/editor/properties/components/configuration/invoice-pre-checkout-operators
 */

/** Подписи операторов переменной (без системных веток condition) */
export const PRE_CHECKOUT_OPERATOR_LABELS: Record<string, string> = {
  /** Переменная непустая */
  filled: 'Переменная введена',
  /** Переменная пустая */
  empty: 'Переменная пустая',
  /** Строки равны */
  equals: 'Равна',
  /** Строки не равны */
  not_equals: 'Не равна',
  /** Вхождение подстроки */
  contains: 'Содержит',
  /** Нет подстроки */
  not_contains: 'Не содержит',
  /** Префикс */
  starts_with: 'Начинается с',
  /** Суффикс */
  ends_with: 'Заканчивается на',
  /** Регулярное выражение */
  matches_regex: 'Регулярное выражение',
  /** Число больше */
  greater_than: 'Больше',
  /** Число меньше */
  less_than: 'Меньше',
  /** Число между двумя значениями */
  between: 'В диапазоне',
  /** Чётное */
  is_even: 'Чётное число',
  /** Нечётное */
  is_odd: 'Нечётное число',
  /** Делится без остатка */
  divisible_by: 'Делится на',
};

/** Операторы без поля значения */
export const PRE_CHECKOUT_NO_VALUE = new Set(['filled', 'empty', 'is_even', 'is_odd']);
