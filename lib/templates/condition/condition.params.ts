/**
 * @fileoverview Параметры для шаблона обработчика узла условия
 * @module templates/condition/condition.params
 */

/** Одна ветка узла условия */
export interface ConditionBranchEntry {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Оператор: "filled" | "empty" | "equals" | "contains" | "greater_than" | "less_than" | "between" | "is_private" | "is_group" | "is_channel" | "else" */
  operator: 'filled' | 'empty' | 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'is_private' | 'is_group' | 'is_channel' | 'is_admin' | 'is_premium' | 'is_bot' | 'else';
  /** Значение для сравнения (только для оператора "equals") */
  value: string;
  /** Второе значение для оператора "between" (диапазон) */
  value2?: string;
  /** ID целевого узла для перехода */
  target?: string;
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
