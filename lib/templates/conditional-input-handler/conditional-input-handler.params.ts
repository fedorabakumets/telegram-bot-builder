/**
 * @fileoverview Параметры для шаблона обработчика условного ввода
 * @module templates/conditional-input-handler/conditional-input-handler.params
 */

/** Кнопка узла */
export interface NodeButton {
  id: string;
  text: string;
  action: string;
  target?: string;
  url?: string;
  skipDataCollection?: boolean;
  requestLocation?: boolean;
}

/** Условное сообщение */
export interface ConditionalMessage {
  variableName?: string;
  variableNames?: string[];
  logicOperator?: string;
  condition: string;
  messageText?: string;
  priority?: number;
  waitForTextInput?: boolean;
  textInputVariable?: string;
  nextNodeAfterInput?: string;
  buttons?: NodeButton[];
  oneTimeKeyboard?: boolean;
}

/** Узел для навигации */
export interface ConditionalNavNode {
  id: string;
  safeName: string;
  type: string;
  data: {
    messageText?: string;
    keyboardType?: string;
    buttons?: NodeButton[];
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    collectUserInput?: boolean;
    allowMultipleSelection?: boolean;
    multiSelectVariable?: string;
    enableConditionalMessages?: boolean;
    conditionalMessages?: ConditionalMessage[];
    inputVariable?: string;
    inputTargetNodeId?: string;
    enableTextInput?: boolean;
    continueButtonText?: string;
    continueButtonTarget?: string;
  };
}

/** Параметры шаблона */
export interface ConditionalInputHandlerTemplateParams {
  /** Все узлы графа */
  nodes: ConditionalNavNode[];
  /** Все ID узлов */
  allNodeIds: string[];
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
  /** Есть ли в проекте хотя бы одна кнопка с skipDataCollection=true */
  hasSkipDataCollectionButtons?: boolean;
}
