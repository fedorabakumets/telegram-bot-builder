/**
 * @fileoverview Типы для условных сообщений
 * @module types/conditional.types
 */

import type { ConditionalRule } from '../utils/conditional-utils';
export type { RuleConflict } from '../utils/conditional-utils';
export type { ProjectVariable } from '../utils/variables-utils';

/**
 * Пропсы для компонента карточки условного сообщения
 */
export interface ConditionalMessageCardProps {
  /** Индекс условия в списке */
  index: number;
  /** Объект условия */
  condition: ConditionalRule;
  /** ID узла */
  nodeId: string;
  /** Доступные вопросы */
  availableQuestions: import('../utils/variables-utils').ProjectVariable[];
  /** Текстовые переменные */
  textVariables: import('../utils/variables-utils').ProjectVariable[];
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  /** Конфликты правила */
  ruleConflicts: import('../utils/conditional-utils').RuleConflict[];
  /** Есть ли ошибки */
  hasErrors: boolean;
  /** Есть ли предупреждения */
  hasWarnings: boolean;
}

/**
 * Данные узла
 */
export interface NodeData {
  /** Текст сообщения */
  messageText?: string;
  /** Тип клавиатуры */
  keyboardType?: string;
  /** Условные сообщения */
  conditionalMessages?: ConditionalRule[];
  [key: string]: unknown;
}
