/**
 * @fileoverview Параметры для шаблона обработчика multi-select кнопки
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.params
 */

/** Объект кнопки */
export interface Button {
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
  /** Пропускать сбор данных */
  skipDataCollection?: boolean;
}

/** Текущий узел (родительский) */
export interface Node {
  /** ID узла */
  id: string;
  /** Input variable узла */
  inputVariable?: string;
}

/** Целевой узел */
export interface TargetNode {
  /** ID узла */
  id: string;
  /** Тип узла */
  type: string;
  /** Разрешён ли множественный выбор */
  allowMultipleSelection?: boolean;
  /** Кнопка продолжения */
  continueButtonTarget?: string;
  /** Переменная для multi-select */
  multiSelectVariable?: string;
  /** Данные узла */
  data: {
    allowMultipleSelection?: boolean;
    continueButtonTarget?: string;
    multiSelectVariable?: string;
    keyboardType?: 'inline' | 'reply' | 'none';
    buttons?: any[];
    messageText?: string;
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    command?: string;
  };
}

/** Параметры для генерации обработчика multi-select кнопки */
export interface MultiSelectButtonHandlerTemplateParams {
  /** Целевой узел */
  targetNode?: TargetNode;
  /** Callback data для идентификации кнопки */
  callbackData: string;
  /** Короткий ID узла для done обработчика */
  shortNodeIdForDone?: string;
  /** Объект кнопки */
  button: Button;
  /** Текущий узел */
  node: Node;
  /** Все узлы для проверки существования целевого */
  nodes: Array<{ id: string; type: string; data: any }>;
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}
