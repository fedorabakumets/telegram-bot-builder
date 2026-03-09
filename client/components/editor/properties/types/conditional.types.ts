/**
 * @fileoverview Типы для условных сообщений
 * @module types/conditional.types
 */

import type { ConditionalRule } from '../utils/conditional-utils';

/**
 * Конфликт правил условных сообщений
 */
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
  availableQuestions: ProjectVariable[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  /** Конфликты правила */
  ruleConflicts: RuleConflict[];
  /** Есть ли ошибки */
  hasErrors: boolean;
  /** Есть ли предупреждения */
  hasWarnings: boolean;
}

/**
 * Переменная проекта
 */
export interface ProjectVariable {
  /** Имя переменной */
  name: string;
  /** ID узла источника */
  nodeId: string;
  /** Тип узла источника */
  nodeType: string;
  /** Описание переменной */
  description?: string;
  /** Тип медиа: "photo", "video", "audio", "document" */
  mediaType?: string;
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
