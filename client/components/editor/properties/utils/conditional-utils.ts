/**
 * @fileoverview Утилиты для проверки условных сообщений
 * Для Telegram Bot Builder.
 * @module conditional-utils
 */

import { getConditionPriority } from '../constants/conditional.constants';

/** Конфликт правил условных сообщений */
export interface RuleConflict {
  /** Индекс правила в массиве */
  ruleIndex: number;
  /** Тип конфликта */
  conflictType: 'duplicate' | 'contradiction' | 'unreachable' | 'missing_variables' | 'missing_value';
  /** Описание проблемы */
  description: string;
  /** Серьёзность: warning или error */
  severity: 'warning' | 'error';
  /** Рекомендация по исправлению */
  suggestion: string;
}

/** Правило условного сообщения */
export interface ConditionalRule {
  /** Тип условия */
  condition?: string;
  /** Имя переменной (устаревшее) */
  variableName?: string;
  /** Массив имён переменных */
  variableNames?: string[];
  /** Ожидаемое значение */
  expectedValue?: string;
  /** Логический оператор */
  logicOperator?: string;
  /** Приоритет правила */
  priority?: number;
  /** ID условия */
  id?: string;
  /** Дополнительные данные */
  [key: string]: unknown;
}

/**
 * Анализирует правила и выявляет конфликты.
 * @param {ConditionalRule[]} rules - Массив правил
 * @returns {RuleConflict[]} Массив обнаруженных конфликтов
 */
export function detectRuleConflicts(rules: ConditionalRule[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const ruleVariables = rule.variableNames || (rule.variableName ? [rule.variableName] : []);
    // Проверка на дубликаты
    for (let j = i + 1; j < rules.length; j++) {
      const otherRule = rules[j];
      const otherVariables = otherRule.variableNames || (otherRule.variableName ? [otherRule.variableName] : []);
      if (rule.condition === otherRule.condition && JSON.stringify(ruleVariables.sort()) === JSON.stringify(otherVariables.sort()) && rule.expectedValue === otherRule.expectedValue && rule.logicOperator === otherRule.logicOperator) {
        conflicts.push({ ruleIndex: i, conflictType: 'duplicate', description: `Условие ${i + 1} дублирует условие ${j + 1}`, severity: 'error', suggestion: 'Удалите одно из дублирующихся условий или измените условия' });
      }
      // Проверка на противоречия
      if ((rule.condition === 'user_data_exists' && otherRule.condition === 'user_data_not_exists') || (rule.condition === 'user_data_not_exists' && otherRule.condition === 'user_data_exists')) {
        const hasCommonVariables = ruleVariables.some(v => otherVariables.includes(v));
        if (hasCommonVariables) {
          conflicts.push({ ruleIndex: i, conflictType: 'contradiction', description: `Условие ${i + 1} противоречит условию ${j + 1}`, severity: 'warning', suggestion: 'Проверьте логику: одно условие проверяет существование переменной, другое - отсутствие' });
        }
      }
    }
    // Проверка на недостижимые правила
    const higherPriorityRules = rules.filter((r, idx) => idx < i && (r.priority || 0) >= (rule.priority || 0));
    for (const higherRule of higherPriorityRules) {
      if (higherRule.condition === 'first_time' || higherRule.condition === 'returning_user') {
        conflicts.push({ ruleIndex: i, conflictType: 'unreachable', description: `Условие ${i + 1} может быть недостижимо из-за условия выше`, severity: 'warning', suggestion: 'Проверьте порядок условий и их приоритеты' });
      }
    }
    // Проверка на отсутствие переменных
    if ((rule.condition?.includes('user_data') || rule.condition?.includes('equals') || rule.condition?.includes('contains')) && ruleVariables.length === 0) {
      conflicts.push({ ruleIndex: i, conflictType: 'missing_variables', description: `Условие ${i + 1} не имеет указанных переменных для проверки`, severity: 'error', suggestion: 'Выберите хотя бы одну переменную для проверки условия' });
    }
    // Проверка на отсутствие значения
    if ((rule.condition === 'user_data_equals' || rule.condition === 'user_data_contains') && !rule.expectedValue) {
      conflicts.push({ ruleIndex: i, conflictType: 'missing_value', description: `Условие ${i + 1} требует указания ожидаемого значения`, severity: 'error', suggestion: 'Укажите значение для сравнения' });
    }
  }
  return conflicts;
}

/**
 * Автоматически исправляет приоритеты правил.
 * @param {ConditionalRule[]} rules - Массив правил
 * @returns {ConditionalRule[]} Правила с исправленными приоритетами
 */
export function autoFixRulePriorities(rules: ConditionalRule[]): ConditionalRule[] {
  return rules.map((rule) => {
    const priority = rule.condition ? getConditionPriority(rule.condition) : 10;
    return { ...rule, priority };
  });
}
