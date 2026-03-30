/**
 * @fileoverview Параметры для шаблона runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.params
 */

export interface NodeData {
  messageText?: string;
  command?: string;
  buttons?: ButtonData[];
  keyboardType?: string;
  keyboardLayout?: any;
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  allowMultipleSelection?: boolean;
  multiSelectVariable?: string;
  continueButtonText?: string;
  continueButtonTarget?: string;
  hideAfterClick?: boolean;
  enableConditionalMessages?: boolean;
  conditionalMessages?: any[];
  collectUserInput?: boolean;
  autoTransition?: boolean;
  autoTransitionTarget?: string;
  variableFilters?: Record<string, any>;
}

export interface ButtonData {
  id?: string;
  text: string;
  action?: string;
  target?: string;
  url?: string;
  hideAfterClick?: boolean;
  skipDataCollection?: boolean;
}

export interface NodeItem {
  id: string;
  safeName: string;
  type: string;
  data: NodeData;
}

/** Параметры для генерации блока проверки состояния ожидания ввода */
export interface HandleUserInputTemplateParams {
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
  /** Все узлы бота */
  nodes?: NodeItem[];
  /** Все ID узлов */
  allNodeIds?: string[];
  /** Есть ли URL кнопки в проекте */
  hasUrlButtons?: boolean;
  /** Есть ли в проекте хотя бы одна кнопка с skipDataCollection=true */
  hasSkipDataCollectionButtons?: boolean;
  /** Узлы с командами (start/command) */
  commandNodes?: NodeItem[];
}
