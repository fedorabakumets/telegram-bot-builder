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
 * - "else"    — во всех остальных случаях (ветка по умолчанию)
 */
export type ConditionOperator = 'filled' | 'empty' | 'equals' | 'contains' | 'else';

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
