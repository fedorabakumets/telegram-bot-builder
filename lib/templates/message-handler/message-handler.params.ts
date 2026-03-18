/**
 * @fileoverview Параметры для шаблона обработчиков управления сообщениями
 * @module templates/message-handler/message-handler.params
 */

export type MessageHandlerNodeType =
  | 'pin_message'
  | 'unpin_message'
  | 'delete_message';

export interface MessageHandlerTemplateParams {
  /** Тип узла */
  nodeType: MessageHandlerNodeType;
  /** ID узла */
  nodeId: string;
  /** Безопасное имя функции (safe_name от nodeId) */
  safeName: string;
  /** Список синонимов-триггеров */
  synonyms: string[];
  /** ID конкретной группы, или '' для всех групп */
  targetGroupId?: string;

  // pin_message
  /** Отключить уведомление при закреплении */
  disableNotification?: boolean;

  // delete_message / pin_message / unpin_message
  /** Текст сообщения после выполнения действия */
  messageText?: string;
}
