/**
 * @fileoverview Типы для условных сообщений
 * @module bot-generator/node-navigation/handle-conditional-messages
 */

/** Условное сообщение на основе пользовательских данных */
export interface ConditionalMessage {
  condition?: string;
  variableName?: string;
  priority?: number;
  messageText?: string;
  buttons?: Array<{
    text: string;
    action: string;
    target?: string;
    id: string;
  }>;
  collectUserInput?: boolean;
  inputVariable?: string;
  nextNodeAfterInput?: string;
  waitForTextInput?: boolean;
  enableTextInput?: boolean;
  [key: string]: unknown;
}
