/**
 * @fileoverview Типы для узла условия (ветвления потока)
 *
 * Описывает структуру данных узла типа `condition` —
 * аналога IF/Switch для визуального редактора Telegram-ботов.
 *
 * @module shared/types/condition-node
 */

/**
 * Оператор для ветки условия — понятный обычному пользователю
 * - "filled"   — переменная заполнена (не пустая)
 * - "empty"   — переменная не заполнена (пустая)
 * - "equals"  — переменная равна указанному значению
 * - "contains" — переменная содержит указанную подстроку
 * - "not_contains" — переменная НЕ содержит указанную подстроку
 * - "starts_with" — переменная начинается с указанной подстроки
 * - "ends_with" — переменная заканчивается на указанную подстроку
 * - "matches_regex" — переменная соответствует регулярному выражению
 * - "is_even" — числовое значение чётное
 * - "is_odd" — числовое значение нечётное
 * - "divisible_by" — числовое значение делится на указанное число
 * - "else"    — во всех остальных случаях (ветка по умолчанию)
 */
export type ConditionOperator = 'filled' | 'empty' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches_regex' | 'greater_than' | 'less_than' | 'between' | 'is_even' | 'is_odd' | 'divisible_by' | 'is_private' | 'is_group' | 'is_channel' | 'is_admin' | 'is_premium' | 'is_bot' | 'is_subscribed' | 'is_not_subscribed' | 'else';

/**
 * Одна ветка узла условия
 */
export interface ConditionBranch {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Отображаемое название ветки */
  label: string;
  /** Оператор: "filled" | "empty" | "equals" | "else" */
  operator: ConditionOperator;
  /** Значение для сравнения (пусто для ветки "else") */
  value: string;
  /** Второе значение для оператора "between" (диапазон) */
  value2?: string;
  /** ID целевого узла для перехода по этой ветке */
  target?: string;
  /** Режим проверки нескольких каналов: "all" — все, "any" — хотя бы один */
  subscriptionMode?: 'all' | 'any';
}

/**
 * Данные узла условия
 */
export interface ConditionNodeData {
  /** Переменная для проверки, например "{{user_name}}" */
  variable: string;
  /** Список веток условия */
  branches: ConditionBranch[];
}
