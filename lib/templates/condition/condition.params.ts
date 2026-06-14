/**
 * @fileoverview Параметры для шаблона обработчика узла условия
 * @module templates/condition/condition.params
 */

/** Одна ветка узла условия */
export interface ConditionBranchEntry {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Оператор: "filled" | "empty" | "equals" | "not_equals" | "contains" | "not_contains" | "starts_with" | "ends_with" | "matches_regex" | "greater_than" | "less_than" | "between" | "is_even" | "is_odd" | "divisible_by" | "is_private" | "is_group" | "is_channel" | "is_admin" | "is_premium" | "is_bot" | "is_subscribed" | "is_not_subscribed" | "else" */
  operator: 'filled' | 'empty' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches_regex' | 'greater_than' | 'less_than' | 'between' | 'is_even' | 'is_odd' | 'divisible_by' | 'is_private' | 'is_group' | 'is_channel' | 'is_admin' | 'is_premium' | 'is_bot' | 'is_subscribed' | 'is_not_subscribed' | 'else';
  /** Значение для сравнения (для операторов "equals", "not_equals", "contains") */
  value: string;
  /** Второе значение для оператора "between" (диапазон) */
  value2?: string;
  /** Значение для оператора "matches_regex" без удвоения слэшей (для raw-строки Python) */
  valueRegex?: string;
  /** ID целевого узла для перехода */
  target?: string;
  /** Режим проверки нескольких каналов: "all" — все, "any" — хотя бы один */
  subscriptionMode?: 'all' | 'any';
}

/** Один узел условия */
export interface ConditionEntry {
  /** ID узла condition */
  nodeId: string;
  /** Переменная для проверки, например "user_name" */
  variable: string;
  /** Ветки условия */
  branches: ConditionBranchEntry[];
}

/** Параметры для генерации всех обработчиков узлов условия */
export interface ConditionTemplateParams {
  /** Массив узлов условия */
  entries: ConditionEntry[];
}
