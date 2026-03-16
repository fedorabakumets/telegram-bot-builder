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

/** Тип узла команды */
export type CommandNodeType = 'start' | 'command' | '';

/** Параметры для генерации обработчика командной callback кнопки */
export interface CommandCallbackHandlerTemplateParams {
  /** Callback data для идентификации кнопки */
  callbackData: string;
  /** Объект кнопки */
  button: CommandButton;
  /** Уровень отступа */
  indentLevel?: string;
  /** Тип узла команды (start, command, или пустая строка) */
  commandNode?: CommandNodeType;
  /** Имя команды (без cmd_) */
  command?: string;
}
