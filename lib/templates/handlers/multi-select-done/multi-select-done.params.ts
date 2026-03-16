/**
 * @fileoverview Параметры для шаблона обработчика multi-select done
 * @module templates/handlers/multi-select-done/multi-select-done.params
 */

/** Кнопка для multi-select */
export interface MultiSelectButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: string;
  /** Target для перехода */
  target?: string;
  /** URL для action='url' */
  url?: string;
  /** Pre-computed callback_data */
  callbackData?: string;
}

/** Данные узла */
export interface NodeData {
  /** Тип клавиатуры */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Кнопки */
  buttons?: MultiSelectButton[];
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
}

/** Целевой узел */
export interface TargetNode {
  /** ID узла */
  id: string;
  /** Тип узла */
  type: string;
  /** Данные узла */
  data: NodeData;
  /** Короткий ID */
  shortId?: string;
  /** Код для клавиатуры */
  keyboardCode?: string;
  /** Код для adjust() */
  adjustCode?: string;
}

/** Узел с множественным выбором */
export interface MultiSelectDoneNode {
  /** ID узла */
  id: string;
  /** Имя переменной для хранения выборов */
  variableName: string;
  /** Target кнопки продолжения */
  continueButtonTarget?: string;
  /** Целевой узел */
  targetNode?: TargetNode;
}

/** Параметры для генерации обработчика multi-select done */
export interface MultiSelectDoneTemplateParams {
  /** Массив узлов с множественным выбором */
  multiSelectNodes: MultiSelectDoneNode[];
  /** Массив всех узлов для поиска целевых узлов */
  allNodes: any[];
  /** Массив всех ID узлов для генерации коротких ID */
  allNodeIds: string[];
  /** Уровень отступа (по умолчанию '') */
  indentLevel?: string;
}
