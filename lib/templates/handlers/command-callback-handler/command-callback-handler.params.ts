/**
 * @fileoverview Параметры для шаблона command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.params
 */

/** Объект кнопки для командной клавиатуры */
export interface CommandButton {
  action: string;
  id: string;
  target: string;
  text: string;
  skipDataCollection?: boolean;
}

/** Параметры для генерации обработчика командной callback кнопки */
export interface CommandCallbackHandlerTemplateParams {
  /** Callback data для идентификации кнопки */
  callbackData: string;
  /** Объект кнопки */
  button: CommandButton;
  /** Уровень отступа */
  indentLevel?: string;
}
