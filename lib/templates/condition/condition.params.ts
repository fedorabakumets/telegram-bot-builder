/**
 * @fileoverview Параметры для шаблона обработчика узла условия
 * @module templates/condition/condition.params
 */

/** Одна ветка узла условия */
export interface ConditionBranchEntry {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Оператор: "filled" | "empty" | "equals" | "contains" | "else" */
  operator: 'filled' | 'empty' | 'equals' | 'contains' | 'else';
  /** Значение для сравнения (только для оператора "equals") */
  value: string;
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
