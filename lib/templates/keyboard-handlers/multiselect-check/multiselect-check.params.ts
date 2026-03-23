/**
 * @fileoverview Параметры для шаблона проверки множественного выбора
 * @module templates/multiselect-check/multiselect-check.params
 */

/** Кнопка узла */
export interface MultiSelectButton {
  id: string;
  text: string;
  action: string;
  target?: string;
}

/** Узел с множественным выбором */
export interface MultiSelectNode {
  id: string;
  safeName: string;
  type: string;
  data: {
    messageText?: string;
    keyboardType?: string;
    buttons?: MultiSelectButton[];
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    allowMultipleSelection?: boolean;
    multiSelectVariable?: string;
    continueButtonText?: string;
    continueButtonTarget?: string;
  };
}

/** Параметры шаблона */
export interface MultiSelectCheckTemplateParams {
  /** Все узлы графа */
  nodes: MultiSelectNode[];
  /** Все ID узлов */
  allNodeIds: string[];
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}
