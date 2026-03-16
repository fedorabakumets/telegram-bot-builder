/**
 * @fileoverview Параметры для шаблона multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.params
 */

import type { Node } from '@shared/schema';

/** Соединение между узлами */
export interface NodeConnection {
  source: string;
  target: string;
}

/** Узел с множественным выбором для шаблона переходов */
export interface MultiSelectNodeForTransition {
  id: string;
  data: {
    continueButtonTarget?: string;
    keyboardType?: 'inline' | 'reply' | 'none';
    messageText?: string;
    command?: string;
    buttons?: any[];
  };
  connections?: NodeConnection[];
}

/** Параметры для генерации логики переходов multi-select */
export interface MultiSelectTransitionTemplateParams {
  /** Узлы с множественным выбором */
  multiSelectNodes: MultiSelectNodeForTransition[];
  /** Все узлы графа */
  nodes: Node[];
  /** Соединения между узлами */
  connections?: NodeConnection[];
  /** Уровень отступа */
  indentLevel?: string;
}
