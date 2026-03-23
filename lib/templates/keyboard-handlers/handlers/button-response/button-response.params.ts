/**
 * @fileoverview Параметры для шаблона обработчика button-response
 * @module templates/handlers/button-response/button-response.params
 */

/** Опция ответа */
export interface ResponseOption {
  /** Текст опции */
  text: string;
  /** Значение опции */
  value?: string;
  /** Действие */
  action?: string;
  /** Target для перехода */
  target?: string;
  /** URL для action='url' */
  url?: string;
}

/** Узел с кнопочным вводом */
export interface UserInputNode {
  /** ID узла */
  id: string;
  /** Опции ответа */
  responseOptions: ResponseOption[];
  /** Разрешить пропуск */
  allowSkip?: boolean;
}

/** Параметры для генерации обработчика button-response */
export interface ButtonResponseTemplateParams {
  /** Узлы с кнопочными ответами */
  userInputNodes: UserInputNode[];
  /** Массив всех узлов для навигации */
  allNodes: any[];
  /** Есть ли URL кнопки в проекте */
  hasUrlButtonsInProject?: boolean;
  /** Уровень отступа (по умолчанию '') */
  indentLevel?: string;
}
