/**
 * @fileoverview Типы для узла условия (ветвления потока)
 *
 * Описывает структуру данных узла типа `condition` —
 * аналога IF/Switch для визуального редактора Telegram-ботов.
 *
 * @module shared/types/condition-node
 */

/**
 * Оператор сравнения для ветки условия
 * - "==" — равно
 * - "!=" — не равно
 * - "contains" — содержит
 * - "else" — ветка по умолчанию (иначе)
 */
export type ConditionOperator = '==' | '!=' | 'contains' | 'else';

/**
 * Одна ветка узла условия
 */
export interface ConditionBranch {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Отображаемое название ветки */
  label: string;
  /** Оператор сравнения: "==", "!=", "contains", "else" */
  operator: ConditionOperator;
  /** Значение для сравнения (пусто для ветки "else") */
  value: string;
  /** ID целевого узла для перехода по этой ветке */
  target?: string;
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
