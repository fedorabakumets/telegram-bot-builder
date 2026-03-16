/**
 * @fileoverview Параметры для шаблона обработчика multi-select reply
 * @module templates/handlers/multi-select-reply/multi-select-reply.params
 */

/** Кнопка выбора для reply */
export interface SelectionButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: 'selection';
  /** Target для перехода */
  target?: string;
}

/** Обычная кнопка (не selection) */
export interface RegularButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: 'goto' | 'url' | 'command';
  /** Target для перехода */
  target?: string;
}

/** Кнопка перехода (goto) */
export interface GotoButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: 'goto';
  /** Target для перехода */
  target: string;
  /** Целевой узел */
  targetNode?: TargetNode;
}

/** Кнопка завершения */
export interface CompleteButton {
  /** Текст кнопки */
  text: string;
  /** Target для перехода */
  target?: string;
}

/** Данные узла */
export interface NodeData {
  /** Тип клавиатуры */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Кнопки */
  buttons?: any[];
  /** Текст сообщения */
  messageText?: string;
  /** Текст кнопки продолжения */
  continueButtonText?: string;
  /** Переменная для multi-select */
  multiSelectVariable?: string;
  /** Resize keyboard */
  resizeKeyboard?: boolean;
  /** One time keyboard */
  oneTimeKeyboard?: boolean;
  /** Команда для command узла */
  command?: string;
}

/** Целевой узел */
export interface TargetNode {
  /** ID узла */
  id: string;
  /** Тип узла */
  type: string;
  /** Данные узла */
  data: NodeData;
  /** Код для клавиатуры */
  keyboardCode?: string;
}

/** Узел с reply множественным выбором */
export interface MultiSelectReplyNode {
  /** ID узла */
  id: string;
  /** Имя переменной для хранения выборов */
  variableName: string;
  /** Target кнопки продолжения */
  continueButtonTarget?: string;
  /** Текст кнопки продолжения */
  continueButtonText?: string;
  /** Кнопка завершения */
  completeButton?: CompleteButton;
  /** Кнопки выбора (selection) */
  selectionButtons: SelectionButton[];
  /** Обычные кнопки */
  regularButtons: RegularButton[];
  /** Кнопки перехода (goto) */
  gotoButtons: GotoButton[];
  /** Код для adjust() */
  adjustCode?: string;
  /** Resize keyboard */
  resizeKeyboard?: boolean;
  /** One time keyboard */
  oneTimeKeyboard?: boolean;
  /** Текст сообщения */
  messageText?: string;
  /** Целевой узел для continueButtonTarget */
  targetNode?: TargetNode;
}

/** Параметры для генерации обработчика multi-select reply */
export interface MultiSelectReplyTemplateParams {
  /** Массив узлов с reply множественным выбором */
  multiSelectNodes: MultiSelectReplyNode[];
  /** Массив всех узлов для поиска целевых узлов */
  allNodes: any[];
  /** Массив всех ID узлов */
  allNodeIds: string[];
  /** Уровень отступа (по умолчанию '') */
  indentLevel?: string;
}
